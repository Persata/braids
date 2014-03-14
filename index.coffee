# Lo-Dash
_ = require 'lodash'

# Underscore String
_.str = require 'underscore.string'

# Bluebird
Promise = require 'bluebird'

# Exec Child Process
exec = require('child_process').exec

# Promisified Exec
execPromisified = Promise.promisify exec

# Extend Method
extend = (protoProps, staticProps) ->
  parent = this
  child = undefined

  # The constructor function for the new subclass is either defined by you
  # (the "constructor" property in your `extend` definition), or defaulted
  # by us to simply call the parent's constructor.
  if protoProps and _.has(protoProps, 'constructor')
    child = protoProps.constructor
  else
    child = ->
      parent.apply this, arguments

  # Add static properties to the constructor function, if supplied.
  _.extend child, parent, staticProps

  # Set the prototype chain to inherit from `parent`, without calling
  # `parent`'s constructor function.
  Surrogate = ->
    @constructor = child
    return

  Surrogate:: = parent::
  child:: = new Surrogate

  # Add prototype properties (instance properties) to the subclass,
  # if supplied.
  if protoProps
    _.extend child::, protoProps

  # Set a convenience property in case the parent's prototype is needed
  # later.
  child.__super__ = parent::
  return child

# File Size Conversion Array
fileSizeConversions = {
  k: 1024, K: 1024, kb: 1024, KB: 1024, kB: 1024,
  m: Math.pow(1024, 2), M: Math.pow(1024, 2), MB: Math.pow(1024, 2),
  g: Math.pow(1024, 3), G: Math.pow(1024, 3), GB: Math.pow(1024, 3)
}

# Humanize Divisions
humanizeDivisions = []
humanizeDivisions[1024] = 'kB'
humanizeDivisions[Math.pow(1024, 2)] = 'MB'
humanizeDivisions[Math.pow(1024, 3)] = 'GB'

# File Size Regex
fileSizeRegex = /(\d+)(\D+)/i

# MIME-Type Wildcard Regex
mimeTypeWildcardRegex = /(\D+)\/(\*)/i

# MIME-Type Of Submitted Form Regex
mimeTypeRegex = /(\D+)\/(\D+)/i

# File Size Parsing Method
sizeInBytes = (sizeString) ->
  # Attempt Match
  regexResult = fileSizeRegex.exec(sizeString)
  # Regex Matches (e.g. not null)
  if regexResult
    # Get Numeric Value
    numericValue = regexResult[1]
    # Get Denomination
    jedecDenomination = regexResult[2]
    # Test Number & JEDEC Denominination
    if (!isNaN(parseFloat(numericValue))) and (fileSizeConversions[jedecDenomination])
      # All Match => Return The Result
      return (numericValue * fileSizeConversions[jedecDenomination])
  else if (regexResult is null) and (!isNaN(parseInt sizeString))
    # Already A Number
    return sizeString
  # If We Don't Return By Now, Throw An Error
  throw new Error 'Unable to parse the maximum file size supplied - use either a number, or JEDEC denomination under 1TB, e.g. 2M, 120kB'

# Humanize The File Size
humanizeBytes = (bytesAmount) ->
  # Iterate
  for divideAmount, humanString of humanizeDivisions
    # Until < 1024, Keep Going
    if ((bytesAmount / divideAmount) < 1024)
      # When < 1024, Return
      return (bytesAmount / divideAmount) + humanString
  # No Match, Return Bytes
  return bytesAmount + ' bytes'

# Braids Base Class
class Braids

  # Joi Instance
  @.joi = require 'joi'

  # Model
  class @.Model
    # Class Name
    name: null

    # Fields
    fields: []

    # Labels
    labels: []

    # Joi Validators
    joiValidators: []

    # Custom Validators
    customValidators: []

    # File Validators
    fileValidators: []

    # Error Messages
    errorMessages: []

    # Constructor
    constructor: ->
      # Name Exists
      if not @.name?
        throw new Error 'You Must Specify A Name For This Model'
      # Pre-Set Field Values
      for field in @.fields
        @[field] = ''

    # Get Field Value
    getFieldValue: (field) =>
      return @[field]

    # Set Field Value
    setFieldValue: (field, value) =>
      @[field] = value

    # Mass Assign Values From JSON / Object
    setValues: (values) =>
      for field in @.fields
        if values[field]
          @[field] = values[field]
      return @

    # Get Values JSON / Object
    getValues: =>
      values = {}
      for field in @.fields
        values[field] = @[field]
      return values

    # Parse A Request Body Into Parameters
    parseRequestAttributes: (request) =>
      # Loop Over Request Parameters
      for parameterKey, parameterValue of request.body
        # Remove Name
        fieldKey = parameterKey.replace(@.name + '_', '')
        # Is This A Field We Should Handle?
        if fieldKey in @.fields
          # Set The Value
          @.setFieldValue(fieldKey, parameterValue)
      # Loop Over Files in Request
      for parameterKey, parameterValue of request.files
        # Remove Name
        fieldKey = parameterKey.replace(@.name + '_', '')
        # Is This A Field We Should Handle?
        if fieldKey in @.fields
          # Set The Value
          @.setFieldValue(fieldKey, parameterValue)
      # Return This For Chaining
      return @

    # Validate
    validate: (allErrors = false) =>
      # Return New Promise
      return new Promise((resolve, reject) =>
        # Clear Error Messages
        @.errorMessages = []
        # Final Result
        modelIsValid = true
        # Try Validation
        try
        # Validate Joi Schema
          if @._joiValidate(allErrors) is false
            modelIsValid = false
          # Wait For All Custom Promises
          Promise.all(@._customValidate(allErrors).concat(@._fileValidate(allErrors))).then (results) =>
            # Check All Results
            _.remove(results, (result) ->
              result is true)
            # Results That Aren't True Are Errors
            if results.length > 0
              # Model Is Invalid, Received Some Errors
              modelIsValid = false
            # Resolve
            resolve { valid: modelIsValid, model: @, values: @.getValues(), errors: @.getAllErrors() }
        catch e
        # Reject Promise Because Of Error
          reject e
      )

    # Add Error For Field
    addError: (field, errorMessage, allErrors) =>
      if @.errorMessages[field] and @.errorMessages[field].length > 0 and allErrors
        @.errorMessages[field].push(errorMessage)
      else
        @.errorMessages[field] = [errorMessage]

    # Get Error Summary
    getAllErrors: =>
      return @.errorMessages

    # Get Error Messages Array For Field
    getErrorsForField: (field) =>
      if @.errorMessages[field]?
        return @.errorMessages[field]
      else
        return []

    # Get The Label Text For A Field
    getLabelText: (field) =>
      # Label Exists?
      if @.labels[field]?
        # Return
        return @.labels[field]
      else
        # Make Words Humanize And Return
        return _.str.humanize(field)

    # Get Container Classes For An Element. If No Glue Specified, Returns An Array
    getContainerClasses: (field, additionalClasses, glue) =>
      # Field Exists
      if _.indexOf(@.fields, field, 0) isnt -1
        # Handle Classes
        classes = []
        if additionalClasses?
          classes = additionalClasses.split ' '
        # Check If Error Message Exists
        if @.errorMessages[field]?
          classes.push 'error'
        # Return
        if classes.length
          if glue?
            return classes.join(glue)
          else
            return classes
        else
          return ''
      else
        throw new Error "Field #{field} Not Found In Model"

    # Field Name or ID
    fieldIdentifier: (field) =>
      # Field Exists
      if field in @.fields
        # Field Name
        fieldName = @.name + '_' + field
        return fieldName
      else
        throw new Error 'Field Not Found In ' + @.name ' Model'

    # Validate Using Joi
    _joiValidate: (allErrors) =>
      # Build Fields
      joiFields = {}
      # Iterate
      for field in @.fields
        # Only Include Fields That Have Joi Validators Assigned
        if @.joiValidators[field]
          joiFields[field] = @.getFieldValue(field)
      # Pass To Validator
      result = Braids.joi.validate joiFields, @.joiValidators, {abortEarly: false}
      # Is Result Null? No Errors, Validation Via Joi Passes
      if result is null
        # Return True
        return true
      else
        # Not Null, Fetch And Store Error Messages
        errors = result.details
        # All Errors?
        if allErrors is true
          for field in @.fields
            # Get Label
            label = @.getLabelText(field)
            @.errorMessages[field] = _(errors).chain()
            .filter({path: field})
            .flatten('message')
            .map((errorString)->
                _.str.capitalize(errorString.replace(field, label)))
            .value()
        else
          for field in @.fields
            # Get Label
            label = @.getLabelText(field)
            # Get First Value Where Path Is The Field
            errorValue = _(errors).chain()
            .filter({path: field})
            .pluck('message')
            .map((errorString)->
                _.str.capitalize(errorString.replace(field, label)))
            .first()
            .value()
            # Store It, If An Actual Error
            if errorValue?
              @.errorMessages[field] = [errorValue]
        # Return False, Invalid Model
        return false

    # Run Custom Validators
    _customValidate: (allErrors) =>
      # Promises Array
      promises = []
      # Iterate Over Fields
      for field in @.fields
        # If All Errors And An Error Message Already Exists, Skip
        if allErrors or !@.errorMessages[field]?
          # Find Validator
          if @.customValidators[field]?
            # Found, Test Type
            if typeof @.customValidators[field] is 'function'
              # Function => Run And Get Result
              promises.push @._validateCustomFunction(field, @.customValidators[field], allErrors)
            else if @.customValidators[field] instanceof Array
              # Array => Concat Array of Custom Promises Onto Existing Promise Array
              promises = promises.concat(@._validateArrayOfCustomValidators(allErrors, field))
            else
              # Unknown Type => Throw Exception
              throw new Error('Custom Validators Must Be A Function Or An Array Of Functions')
      # Return Promises
      return promises

    # Handle Array of Custom Validators
    _validateArrayOfCustomValidators: (allErrors, field) =>
      # Promises Array
      promises = []
      # Get Custom Validators
      customValidatorArray = @.customValidators[field]
      # Iterate
      for customValidatorFunction in customValidatorArray
        # Push Onto The Promises Array Single
        promises.push @._validateCustomFunction field, customValidatorFunction, allErrors
      # Return Custom Promises Array
      return promises

    # Validate A Single Custom Function
    _validateCustomFunction: (field, validationFunction, allErrors) ->
      # Get Label
      label = @.getLabelText(field)
      # Get Value
      fieldValue = @.getFieldValue(field)
      # Call Validation Function
      validationFunction(fieldValue, @).then (result) =>
        # If Not Exactly True
        if result isnt true
          parsedErrorMessage = result.replace '{{label}}', label
          # Add Error
          @.addError field, parsedErrorMessage, allErrors
          # Return
          return false
        else
          # Return True => Valid
          return true

    # Validate Any Files Against File Validation Functions
    _fileValidate: (allErrors) =>
      # File Validation Promises Array
      promises = []
      # Iterate Over Friends
      for field in @.fields
        # If Not All Errors And An Error Message Already Exists, Skip
        if allErrors or !@.errorMessages[field]?
          # Find Validator
          if @.fileValidators[field]?
            # Push Validator Onto Array
            promises.push new @.fileValidators[field]().validate(field, @, allErrors)
      # Return Array of Promises
      return promises

  # File Validator
  class @.FileValidator
    # Required
    required: false
    # Maximum Size
    maxFileSize: null
    # Valid MIME Types
    validMimeTypes: []
    # Enforce MIME Match With Extension
    enforceMimeMatch: false
    # Validate Function
    validate: (field, model, allErrors) =>
      return new Promise((resolve) =>
        # Overall Result
        overallResult = true
        # Get File Value From Model
        fileObject = model[field]
        # Get Label
        label = model.getLabelText(field)
        # Required?
        if @.required is true
          # Check Name and Size
          if !fileObject? or fileObject.size is 0 or fileObject.name is '' or fileObject.originalFilename is ''
            model.addError(field, "#{label} is a required field")
            # Overall Is False
            overallResult = false
            # All Errors?
            if allErrors isnt true
              resolve(overallResult)
        # Valid MIME-Type?
        if @.validMimeTypes and @.validMimeTypes.length > 0
          # Wildcard Result
          wildCardResult = false
          # Wildcard Array
          wildcardValues = []
          # Check Wildcards
          for mimeType in @.validMimeTypes
            # Regex Exec
            regexResult = mimeTypeWildcardRegex.exec(mimeType)
            # Matches?
            if regexResult and (regexResult.length is 3)
              # Add It To Our Wildcard Array
              wildcardValues.push regexResult[1]
          # Any Wildcard Values Obtained?
          if wildcardValues.length > 0
            # Get First Part of Uploaded File's MIME-Type
            uploadedMimeTypeResult = mimeTypeRegex.exec(fileObject.type)
            # Valid? Should Be!
            if uploadedMimeTypeResult and (uploadedMimeTypeResult.length is 3)
              # Compare
              if uploadedMimeTypeResult[1] in wildcardValues
                # Result
                wildCardResult = true
          # Test Other Provided MIME-Types, And Check The Wildcard Result
          if (fileObject.type not in @.validMimeTypes) and wildCardResult is false
            # Error String
            errorString = "#{label} must be one of the following file types: " + (@.validMimeTypes.join ", ")
            # Add Error
            model.addError(field, errorString, allErrors)
            # Overall Result
            overallResult = false
            # All Errors?
            if allErrors isnt true
              resolve(overallResult)
        # Size Within Limits?
        if @.maxFileSize
          # Parse Size
          bytesAmount = sizeInBytes @.maxFileSize
          # Compare Size to Size In Bytes Parsed String
          if fileObject.size > bytesAmount
            # Error String
            errorString = "#{label} is too large - it must be smaller than " + (humanizeBytes bytesAmount)
            # Too Large - Add Error
            model.addError(field, errorString, allErrors)
            # Overall Result
            overallResult = false
            # All Errors?
            if allErrors isnt true
              resolve(overallResult)
        # Enforce MIME Match?
        if @.enforceMimeMatch
          # Get File Path
          filePath = fileObject.path
          # Get File Type
          fileType = fileObject.type.trim()
          # Generate A Promise For The file() Command
          execPromisified("file #{filePath} --mime-type --brief -r").then (results) =>
            # Get Result of File Process
            fileResult = results[0].trim()
            # Compare To What The Browser Told Us
            if fileType isnt fileResult
              # Incorrect, Get Error String
              errorString = "The file you uploaded is actually the type of #{fileResult}, but the extension is of type #{fileType} - please correct this and try uploading again"
              # Add Error
              model.addError(field, errorString, allErrors)
              # Invalid
              overallResult = false
            # Resolve Our Promise
            resolve(overallResult)
        else
          # Resolve At The End - Doing Nothing Here Asynchronously
          resolve(overallResult)
      )

  # Model Extend
  @Model.Extend = @Model.extend = @FileValidator.Extend = @FileValidator.extend = extend

# Module Exports
module.exports = Braids
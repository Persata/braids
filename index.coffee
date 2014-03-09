# Lo-Dash
_ = require 'lodash'

# Underscore String
_.str = require 'underscore.string'

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
  child

# Braids Base Class
class BraidBase

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
      # Clear Error Messages
      @.errorMessages = []
      # Final Result
      modelIsValid = true
      # Validate Joi Schema
      if @._joiValidate(allErrors) is false
        modelIsValid = false
      # Custom Validators
      if @._customValidate(allErrors) is false
        modelIsValid = false
      # File Validators
      if @._fileValidate(allErrors) is false
        modelIsValid = false
      # Return Model Validation Result
      return modelIsValid

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
      result = BraidBase.joi.validate joiFields, @.joiValidators, {abortEarly: false}
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
      # Iterate Over Fields
      for field in @.fields
        # If All Errors And An Error Message Already Exists, Skip
        if allErrors or !@.errorMessages[field]?
          # Find Validator
          if @.customValidators[field]?
            # Found, Test Type
            if typeof @.customValidators[field] is 'function'
              # Function => Run And Get Result
              return @._validateCustomFunction(field, @.customValidators[field], allErrors)
            else if @.customValidators[field] instanceof Array
              # Array => Validate Each Individually
              return @._validateArrayOfCustomValidators(allErrors, field)
            else
              # Unknown Type => Throw Exception
              throw new Error('Custom Validators Must Be A Function Or An Array Of Functions')

    # Handle Array of Custom Validators
    _validateArrayOfCustomValidators: (allErrors, field) =>
      # Initial Result (Assume Valid)
      overallResult = true
      # Get Custom Validators
      customValidatorArray = @.customValidators[field]
      # Iterate
      for customValidatorFunction in customValidatorArray
        # Validate Single
        singleResult = @._validateCustomFunction field, customValidatorFunction, allErrors
        # If Result Is False (Invalid), Overall Is False
        if singleResult isnt true
          overallResult = false
          # Continue With Rest Of Errors?
          if allErrors isnt true
            return overallResult
      # Return Overall Result Once All Validated
      return overallResult

    # Validate A Single Custom Function
    _validateCustomFunction: (field, validationFunction, allErrors) =>
      # Get Label
      label = @.getLabelText(field)
      # Get Value
      fieldValue = @.getFieldValue(field)
      # Call Validation Function
      validationResult = validationFunction(fieldValue)
      # If True, i.e. Valid
      if validationResult is true
        return true
      else
        # Else, Store Error Message
        parsedErrorMessage = validationResult.replace '{{label}}', label
        @.addError(field, parsedErrorMessage, allErrors)

    # Validate Any Files Against File Validation Functions
    _fileValidate: (allErrors) =>
      # Overall Result for File Validation
      overallResult = true
      # Iterate Over Fields
      for field in @.fields
        # If Not All Errors And An Error Message Already Exists, Skip
        if allErrors or !@.errorMessages[field]?
          # Find Validator
          if @.fileValidators[field]?
            if new @.fileValidators[field]().validate(field, @, allErrors) isnt true
              overallResult = false
      # Return Overall Result
      return overallResult

  # File Validator
  class @.FileValidator
    # Required
    required: false
    # Maximum Size
    maxFileSize: null
    # Valid MIME Types
    validMimeTypes: []
    # Validate Function
    validate: (field, model, allErrors) =>
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
            return overallResult
      # Valid MIME-Type?
      if @.validMimeTypes and @.validMimeTypes.length > 0
        # Get MIME Type Of Upload, Check It's In The Allowed Array
        if fileObject.type not in @.validMimeTypes
          # Error String
          errorString = "#{label} must be one of the following file types: " + (@.validMimeTypes.join ", ")
          # Add Error
          model.addError(field, errorString, allErrors)
          # Overall Result
          overallResult = false
          # All Errors?
          if allErrors isnt true
            return overallResult
      # Return At The End
      return overallResult

  # Model Extend
  @Model.Extend = @Model.extend = @FileValidator.Extend = @FileValidator.extend = extend

# Module Exports
module.exports = BraidBase
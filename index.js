// Generated by CoffeeScript 1.7.1
(function() {
  var BraidBase, extend, _,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  _ = require('lodash');

  _.str = require('underscore.string');

  extend = function(protoProps, staticProps) {
    var Surrogate, child, parent;
    parent = this;
    child = void 0;
    if (protoProps && _.has(protoProps, 'constructor')) {
      child = protoProps.constructor;
    } else {
      child = function() {
        return parent.apply(this, arguments);
      };
    }
    _.extend(child, parent, staticProps);
    Surrogate = function() {
      this.constructor = child;
    };
    Surrogate.prototype = parent.prototype;
    child.prototype = new Surrogate;
    if (protoProps) {
      _.extend(child.prototype, protoProps);
    }
    child.__super__ = parent.prototype;
    return child;
  };

  BraidBase = (function() {
    function BraidBase() {}

    BraidBase.joi = require('joi');

    BraidBase.Model = (function() {
      Model.prototype.name = null;

      Model.prototype.fields = [];

      Model.prototype.labels = [];

      Model.prototype.joiValidators = [];

      Model.prototype.customValidators = [];

      Model.prototype.fileValidators = [];

      Model.prototype.errorMessages = [];

      function Model() {
        this._fileValidate = __bind(this._fileValidate, this);
        this._validateCustomFunction = __bind(this._validateCustomFunction, this);
        this._validateArrayOfCustomValidators = __bind(this._validateArrayOfCustomValidators, this);
        this._customValidate = __bind(this._customValidate, this);
        this._joiValidate = __bind(this._joiValidate, this);
        this.fieldIdentifier = __bind(this.fieldIdentifier, this);
        this.getContainerClasses = __bind(this.getContainerClasses, this);
        this.getLabelText = __bind(this.getLabelText, this);
        this.getErrorsForField = __bind(this.getErrorsForField, this);
        this.getAllErrors = __bind(this.getAllErrors, this);
        this.addError = __bind(this.addError, this);
        this.validate = __bind(this.validate, this);
        this.parseRequestAttributes = __bind(this.parseRequestAttributes, this);
        this.getValues = __bind(this.getValues, this);
        this.setValues = __bind(this.setValues, this);
        this.setFieldValue = __bind(this.setFieldValue, this);
        this.getFieldValue = __bind(this.getFieldValue, this);
        var field, _i, _len, _ref;
        if (this.name == null) {
          throw new Error('You Must Specify A Name For This Model');
        }
        _ref = this.fields;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          field = _ref[_i];
          this[field] = '';
        }
      }

      Model.prototype.getFieldValue = function(field) {
        return this[field];
      };

      Model.prototype.setFieldValue = function(field, value) {
        return this[field] = value;
      };

      Model.prototype.setValues = function(values) {
        var field, _i, _len, _ref;
        _ref = this.fields;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          field = _ref[_i];
          if (values[field]) {
            this[field] = values[field];
          }
        }
        return this;
      };

      Model.prototype.getValues = function() {
        var field, values, _i, _len, _ref;
        values = {};
        _ref = this.fields;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          field = _ref[_i];
          values[field] = this[field];
        }
        return values;
      };

      Model.prototype.parseRequestAttributes = function(request) {
        var fieldKey, parameterKey, parameterValue, _ref, _ref1;
        _ref = request.body;
        for (parameterKey in _ref) {
          parameterValue = _ref[parameterKey];
          fieldKey = parameterKey.replace(this.name + '_', '');
          if (__indexOf.call(this.fields, fieldKey) >= 0) {
            this.setFieldValue(fieldKey, parameterValue);
          }
        }
        _ref1 = request.files;
        for (parameterKey in _ref1) {
          parameterValue = _ref1[parameterKey];
          fieldKey = parameterKey.replace(this.name + '_', '');
          if (__indexOf.call(this.fields, fieldKey) >= 0) {
            this.setFieldValue(fieldKey, parameterValue);
          }
        }
        return this;
      };

      Model.prototype.validate = function(allErrors) {
        var modelIsValid;
        if (allErrors == null) {
          allErrors = false;
        }
        this.errorMessages = [];
        modelIsValid = true;
        if (this._joiValidate(allErrors) === false) {
          modelIsValid = false;
        }
        if (this._customValidate(allErrors) === false) {
          modelIsValid = false;
        }
        if (this._fileValidate(allErrors) === false) {
          modelIsValid = false;
        }
        return modelIsValid;
      };

      Model.prototype.addError = function(field, errorMessage, allErrors) {
        if (this.errorMessages[field] && this.errorMessages[field].length > 0 && allErrors) {
          return this.errorMessages[field].push(errorMessage);
        } else {
          return this.errorMessages[field] = [errorMessage];
        }
      };

      Model.prototype.getAllErrors = function() {
        return this.errorMessages;
      };

      Model.prototype.getErrorsForField = function(field) {
        if (this.errorMessages[field] != null) {
          return this.errorMessages[field];
        } else {
          return [];
        }
      };

      Model.prototype.getLabelText = function(field) {
        if (this.labels[field] != null) {
          return this.labels[field];
        } else {
          return _.str.humanize(field);
        }
      };

      Model.prototype.getContainerClasses = function(field, additionalClasses, glue) {
        var classes;
        if (_.indexOf(this.fields, field, 0) !== -1) {
          classes = [];
          if (additionalClasses != null) {
            classes = additionalClasses.split(' ');
          }
          if (this.errorMessages[field] != null) {
            classes.push('error');
          }
          if (classes.length) {
            if (glue != null) {
              return classes.join(glue);
            } else {
              return classes;
            }
          } else {
            return '';
          }
        } else {
          throw new Error("Field " + field + " Not Found In Model");
        }
      };

      Model.prototype.fieldIdentifier = function(field) {
        var fieldName;
        if (__indexOf.call(this.fields, field) >= 0) {
          fieldName = this.name + '_' + field;
          return fieldName;
        } else {
          throw new Error('Field Not Found In ' + this.name(' Model'));
        }
      };

      Model.prototype._joiValidate = function(allErrors) {
        var errorValue, errors, field, joiFields, label, result, _i, _j, _k, _len, _len1, _len2, _ref, _ref1, _ref2;
        joiFields = {};
        _ref = this.fields;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          field = _ref[_i];
          if (this.joiValidators[field]) {
            joiFields[field] = this.getFieldValue(field);
          }
        }
        result = BraidBase.joi.validate(joiFields, this.joiValidators, {
          abortEarly: false
        });
        if (result === null) {
          return true;
        } else {
          errors = result.details;
          if (allErrors === true) {
            _ref1 = this.fields;
            for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
              field = _ref1[_j];
              label = this.getLabelText(field);
              this.errorMessages[field] = _(errors).chain().filter({
                path: field
              }).flatten('message').map(function(errorString) {
                return _.str.capitalize(errorString.replace(field, label));
              }).value();
            }
          } else {
            _ref2 = this.fields;
            for (_k = 0, _len2 = _ref2.length; _k < _len2; _k++) {
              field = _ref2[_k];
              label = this.getLabelText(field);
              errorValue = _(errors).chain().filter({
                path: field
              }).pluck('message').map(function(errorString) {
                return _.str.capitalize(errorString.replace(field, label));
              }).first().value();
              if (errorValue != null) {
                this.errorMessages[field] = [errorValue];
              }
            }
          }
          return false;
        }
      };

      Model.prototype._customValidate = function(allErrors) {
        var field, _i, _len, _ref;
        _ref = this.fields;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          field = _ref[_i];
          if (allErrors || (this.errorMessages[field] == null)) {
            if (this.customValidators[field] != null) {
              if (typeof this.customValidators[field] === 'function') {
                return this._validateCustomFunction(field, this.customValidators[field], allErrors);
              } else if (this.customValidators[field] instanceof Array) {
                return this._validateArrayOfCustomValidators(allErrors, field);
              } else {
                throw new Error('Custom Validators Must Be A Function Or An Array Of Functions');
              }
            }
          }
        }
      };

      Model.prototype._validateArrayOfCustomValidators = function(allErrors, field) {
        var customValidatorArray, customValidatorFunction, overallResult, singleResult, _i, _len;
        overallResult = true;
        customValidatorArray = this.customValidators[field];
        for (_i = 0, _len = customValidatorArray.length; _i < _len; _i++) {
          customValidatorFunction = customValidatorArray[_i];
          singleResult = this._validateCustomFunction(field, customValidatorFunction, allErrors);
          if (singleResult !== true) {
            overallResult = false;
            if (allErrors !== true) {
              return overallResult;
            }
          }
        }
        return overallResult;
      };

      Model.prototype._validateCustomFunction = function(field, validationFunction, allErrors) {
        var fieldValue, label, parsedErrorMessage, validationResult;
        label = this.getLabelText(field);
        fieldValue = this.getFieldValue(field);
        validationResult = validationFunction(fieldValue);
        if (validationResult === true) {
          return true;
        } else {
          parsedErrorMessage = validationResult.replace('{{label}}', label);
          return this.addError(field, parsedErrorMessage, allErrors);
        }
      };

      Model.prototype._fileValidate = function(allErrors) {
        var field, overallResult, _i, _len, _ref;
        overallResult = true;
        _ref = this.fields;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          field = _ref[_i];
          if (allErrors || (this.errorMessages[field] == null)) {
            if (this.fileValidators[field] != null) {
              if (new this.fileValidators[field]().validate(field, this, allErrors) !== true) {
                overallResult = false;
              }
            }
          }
        }
        return overallResult;
      };

      return Model;

    })();

    BraidBase.FileValidator = (function() {
      function FileValidator() {
        this.validate = __bind(this.validate, this);
      }

      FileValidator.prototype.required = false;

      FileValidator.prototype.maxFileSize = null;

      FileValidator.prototype.validMimeTypes = [];

      FileValidator.prototype.validate = function(field, model, allErrors) {
        var errorString, fileObject, label, overallResult, _ref;
        overallResult = true;
        fileObject = model[field];
        label = model.getLabelText(field);
        if (this.required === true) {
          if ((fileObject == null) || fileObject.size === 0 || fileObject.name === '' || fileObject.originalFilename === '') {
            model.addError(field, "" + label + " is a required field");
            overallResult = false;
            if (allErrors !== true) {
              return overallResult;
            }
          }
        }
        if (this.validMimeTypes && this.validMimeTypes.length > 0) {
          if (_ref = fileObject.type, __indexOf.call(this.validMimeTypes, _ref) < 0) {
            errorString = ("" + label + " must be one of the following file types: ") + (this.validMimeTypes.join(", "));
            model.addError(field, errorString, allErrors);
            overallResult = false;
            if (allErrors !== true) {
              return overallResult;
            }
          }
        }
        return overallResult;
      };

      return FileValidator;

    })();

    BraidBase.Model.Extend = BraidBase.Model.extend = BraidBase.FileValidator.Extend = BraidBase.FileValidator.extend = extend;

    return BraidBase;

  })();

  module.exports = BraidBase;

}).call(this);

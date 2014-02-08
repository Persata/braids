// Generated by CoffeeScript 1.7.1
(function() {
  var BraidBase, _,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; },
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  _ = require('lodash');

  _.str = require('underscore.string');

  BraidBase = (function() {
    BraidBase.joi = require('joi');

    BraidBase.prototype.name = null;

    BraidBase.prototype.fields = [];

    BraidBase.prototype.labels = [];

    BraidBase.prototype.joiValidators = [];

    BraidBase.prototype.customValidators = [];

    BraidBase.prototype.errorMessages = [];

    function BraidBase() {
      this._validateCustomFunction = __bind(this._validateCustomFunction, this);
      this._validateArrayOfCustomValidators = __bind(this._validateArrayOfCustomValidators, this);
      this._customValidate = __bind(this._customValidate, this);
      this._joiValidate = __bind(this._joiValidate, this);
      this.fieldIdentifier = __bind(this.fieldIdentifier, this);
      this.getContainerClasses = __bind(this.getContainerClasses, this);
      this.getLabelText = __bind(this.getLabelText, this);
      this.getErrorsForField = __bind(this.getErrorsForField, this);
      this.getAllErrors = __bind(this.getAllErrors, this);
      this.validate = __bind(this.validate, this);
      this.parseRequestAttributes = __bind(this.parseRequestAttributes, this);
      this.getValues = __bind(this.getValues, this);
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

    BraidBase.prototype.getFieldValue = function(field) {
      return this[field];
    };

    BraidBase.prototype.setFieldValue = function(field, value) {
      return this[field] = value;
    };

    BraidBase.prototype.getValues = function() {
      var field, values, _i, _len, _ref;
      values = {};
      _ref = this.fields;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        field = _ref[_i];
        values[field] = this[field];
      }
      return values;
    };

    BraidBase.prototype.parseRequestAttributes = function(request) {
      var fieldKey, parameterKey, parameterValue, _ref;
      _ref = request.body;
      for (parameterKey in _ref) {
        parameterValue = _ref[parameterKey];
        fieldKey = parameterKey.replace(this.name + '_', '');
        if (__indexOf.call(this.fields, fieldKey) >= 0) {
          this.setFieldValue(fieldKey, parameterValue);
        }
      }
      return this;
    };

    BraidBase.prototype.validate = function(allErrors) {
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
      return modelIsValid;
    };

    BraidBase.prototype.getAllErrors = function() {
      return this.errorMessages;
    };

    BraidBase.prototype.getErrorsForField = function(field) {
      if (this.errorMessages[field] != null) {
        return this.errorMessages[field];
      } else {
        return [];
      }
    };

    BraidBase.prototype.getLabelText = function(field) {
      if (this.labels[field] != null) {
        return this.labels[field];
      } else {
        return _.str.humanize(field);
      }
    };

    BraidBase.prototype.getContainerClasses = function(field, additionalClasses, glue) {
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

    BraidBase.prototype.fieldIdentifier = function(field) {
      var fieldName;
      if (__indexOf.call(this.fields, field) >= 0) {
        fieldName = this.name + '_' + field;
        return fieldName;
      } else {
        throw new Error('Field Not Found In ' + this.name(' Model'));
      }
    };

    BraidBase.prototype._joiValidate = function(allErrors) {
      var errorValue, errors, field, joiFields, label, result, _i, _j, _k, _len, _len1, _len2, _ref, _ref1, _ref2;
      joiFields = {};
      _ref = this.fields;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        field = _ref[_i];
        joiFields[field] = this.getFieldValue(field);
      }
      result = BraidBase.joi.validate(joiFields, this.joiValidators, {
        abortEarly: false
      });
      if (result === null) {
        return true;
      } else {
        errors = result._errors;
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

    BraidBase.prototype._customValidate = function(allErrors) {
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

    BraidBase.prototype._validateArrayOfCustomValidators = function(allErrors, field) {
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

    BraidBase.prototype._validateCustomFunction = function(field, validationFunction, allErrors) {
      var fieldValue, label, parsedErrorMessage, validationResult;
      label = this.getLabelText(field);
      fieldValue = this.getFieldValue(field);
      validationResult = validationFunction(fieldValue);
      if (validationResult === true) {
        return true;
      } else {
        parsedErrorMessage = validationResult.replace('{{label}}', label);
        if (this.errorMessages[field] && this.errorMessages[field].length > 0 && allErrors) {
          return this.errorMessages[field].push(parsedErrorMessage);
        } else {
          return this.errorMessages[field] = [parsedErrorMessage];
        }
      }
    };

    BraidBase.Model = function() {};

    BraidBase.Model.Extend = function(options) {
      var NewModel, modelOptions;
      modelOptions = {
        name: void 0,
        fields: [],
        labels: {},
        joiValidators: {},
        customValidators: {}
      };
      modelOptions = _.defaults(options, modelOptions);
      if (modelOptions.name === void 0) {
        throw new Error('You Must Specify A Model Name');
      }
      if (modelOptions.fields === void 0 || modelOptions.fields.length < 1) {
        throw new Error('You Must Specify At Least One Field');
      }
      NewModel = (function(_super) {
        __extends(NewModel, _super);

        function NewModel() {
          return NewModel.__super__.constructor.apply(this, arguments);
        }

        NewModel.prototype.name = modelOptions.name;

        NewModel.prototype.fields = modelOptions.fields;

        NewModel.prototype.labels = modelOptions.labels;

        NewModel.prototype.joiValidators = modelOptions.joiValidators;

        NewModel.prototype.customValidators = modelOptions.customValidators;

        return NewModel;

      })(BraidBase);
      return NewModel;
    };

    return BraidBase;

  })();

  module.exports = BraidBase;

}).call(this);

//# sourceMappingURL=index.map

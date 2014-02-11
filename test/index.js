'use strict';

var BraidsBase = require('../');
var should = require('should');

describe('Braids', function () {

    /**
     * Test Models
     */
    var testModel, testModelWithoutLabels;

    /**
     * Test Model Instances
     */
    var testModelInstance, testModelWithoutLabelsInstance;

    /**
     * Model Name
     * @type {string}
     */
    var modelName = 'loginForm';

    /**
     * Model Fields
     * @type {string[]}
     */
    var modelFields = ['email_address', 'password'];

    /**
     * Model Labels
     * @type {{email_address: string, password: string}}
     */
    var modelLabels = {email_address: 'Email Address', password: 'Password'};

    /**
     * Model Validators
     */
    var modelValidators = {
        email_address: BraidsBase.joi.string().required().email(),
        password: BraidsBase.joi.string().required()
    };

    /**
     * Custom Validators (Will Test Later)
     * @type {{}}
     */
    var customValidators = {
        email_address: function (value) {
            if (value === 'notanemailaddress') {
                return 'That is obviously not an email address';
            } else if (value === 'definitelynotanemailaddress') {
                return 'That value for {{label}} is not allowed';
            } else {
                return true;
            }
        }
    };

    /**
     * Good Values to Test
     */
    var goodValueRequestStub = {body: {loginForm_email_address: 'valid@example.com', loginForm_password: 'password456'}};

    /**
     * Bad Values To Test
     */
    var badValueRequestStub = {body: {loginForm_email_address: 'notanemailaddress', loginForm_password: ''}};
    var badValueRequestStubWithLabelTest = {body: {loginForm_email_address: 'definitelynotanemailaddress', loginForm_password: ''}};

    /**
     * Before - Create Model and Instance
     */
    before(function () {
//        testModel = BraidsBase.Model.Extend(modelName, modelFields, modelLabels, modelValidators, customValidators);
        testModel = BraidsBase.Model.Extend({
            name: modelName,
            fields: modelFields,
            labels: modelLabels,
            joiValidators: modelValidators,
            customValidators: customValidators
        });
        testModelWithoutLabels = BraidsBase.Model.Extend({
            name: modelName,
            fields: modelFields,
            joiValidators: modelValidators,
            customValidators: customValidators
        });
        testModelInstance = new testModel();
        testModelWithoutLabelsInstance = new testModelWithoutLabels();
    });

    it('should be extendable', function (done) {
        testModel.should.be.a.Function;
        done();
    });

    it('should have properties', function (done) {
        testModelInstance.should.have.property('email_address');
        testModelInstance.should.have.property('password');
        done();
    });

    it('should have labels', function (done) {
        testModelInstance.getLabelText('email_address').should.equal('Email Address');
        testModelInstance.getLabelText('password').should.equal('Password');
        done();
    });

    it('should create humanised labels when not provided', function (done) {
        testModelWithoutLabelsInstance.getLabelText('email_address').should.equal('Email address');
        testModelWithoutLabelsInstance.getLabelText('password').should.equal('Password');
        done();
    });

    it('should provide html id & name attributes for templates', function (done) {
        testModelInstance.fieldIdentifier('email_address').should.equal(modelName + '_' + 'email_address');
        testModelInstance.fieldIdentifier('password').should.equal(modelName + '_' + 'password');
        done();
    });

    it('should provide useful container classes for templates', function (done) {
        testModelInstance.parseRequestAttributes(goodValueRequestStub).validate(true);
        var goodRequestClasses = testModelInstance.getContainerClasses('email_address', 'row');
        goodRequestClasses.should.not.containEql('error');
        goodRequestClasses.should.containEql('row');

        testModelInstance.parseRequestAttributes(badValueRequestStub).validate(true);
        var badRequestClasses = testModelInstance.getContainerClasses('email_address', 'row');
        badRequestClasses.should.containEql('error');
        badRequestClasses.should.containEql('row');

        var badRequestClassesWithGlue = testModelInstance.getContainerClasses('email_address', 'row', ' ');
        badRequestClassesWithGlue.should.equal('row error');
        done();
    });

    it('should validate successfully with these values', function (done) {
        var result = testModelInstance.parseRequestAttributes(goodValueRequestStub).validate(true);
        result.should.be.true;
        done();
    });

    it('should validate unsuccessfully with these values', function (done) {
        var result = testModelInstance.parseRequestAttributes(badValueRequestStub).validate(true);
        result.should.be.false;
        done();
    });

    it('should have error messages for these values', function (done) {
        testModelInstance.parseRequestAttributes(badValueRequestStub).validate(true);
        var errors = testModelInstance.getAllErrors();
        errors.should.be.an.Array;
        errors.should.have.property('email_address');
        errors.email_address.should.be.an.Array;
        errors.email_address.should.containEql('The value of Email Address must be a valid email');
        errors.email_address.should.containEql('That is obviously not an email address');
        testModelInstance.getErrorsForField('email_address').should.containEql('The value of Email Address must be a valid email');
        done();
    });

    it('should parse the labels for custom validator errors', function (done) {
        testModelInstance.parseRequestAttributes(badValueRequestStubWithLabelTest).validate(true);
        var errors = testModelInstance.getAllErrors();
        errors.email_address.should.containEql('That value for Email Address is not allowed');
        errors.email_address[1].should.not.containEql('{{label}}');
        done();
    });

    it('should parse the labels for custom validator errors on models with automatically generated labels', function (done) {
        testModelWithoutLabelsInstance.parseRequestAttributes(badValueRequestStubWithLabelTest).validate(true);
        var errors = testModelWithoutLabelsInstance.getAllErrors();
        errors.email_address.should.containEql('That value for Email address is not allowed');
        errors.email_address[1].should.not.containEql('{{label}}');
        done();
    });

    it('should get values back from parsing the request', function (done) {
        testModelInstance.parseRequestAttributes(goodValueRequestStub).validate(true);
        var allValues = testModelInstance.getValues();
        allValues.should.have.property('email_address', 'valid@example.com');
        allValues.should.have.property('password', 'password456');
        testModelInstance.getFieldValue('email_address').should.equal('valid@example.com');
        done();
    });

    it('should allow mass assigning of values from other objects with the same keys', function (done) {
        var badResult = testModelInstance.parseRequestAttributes(badValueRequestStubWithLabelTest).validate(true);
        var testObject = {
            email_address: 'emailaddress@example.com',
            password: 'password987'
        };
        testModelInstance.setValues(testObject);
        var goodResult = testModelInstance.validate(true);
        testModelInstance.getValues().email_address.should.equal('emailaddress@example.com');
        testModelInstance.email_address.should.equal('emailaddress@example.com');
        testModelInstance.getValues().password.should.equal('password987');
        goodResult.should.be.true;
        badResult.should.be.false;
        done();
    });
});

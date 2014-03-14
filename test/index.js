'use strict';

var BraidsBase = require('../');
var Promise = require('bluebird');
var Knex = require('knex');
var should = require('should');

describe('Braids', function() {

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
        email_address: BraidsBase.joi.string().email().required(),
        password: BraidsBase.joi.string().required()
    };

    /**
     * Custom Validators (Will Test Later)
     * @type {{}}
     */
    var customValidators = {
        email_address: [
            function(value) {
                return new Promise(function(resolve) {
                    knexInstance('users').select('email').where('email', '=', value).then(function(result) {
                        if (result.length > 0) {
                            resolve('That {{label}} is already in use');
                        } else {
                            resolve(true);
                        }
                    });
                })
            },
            function(value) {
                return new Promise(function(resolve) {
                    if (value === 'notavalidemailaddress') {
                        resolve('That is obviously not an email address');
                    } else if (value === 'definitelynotanemailaddress') {
                        resolve('That value for {{label}} is not allowed');
                    } else {
                        resolve(true);
                    }
                })
            }
        ]
    };

    /**
     * Good Values to Test
     */
    var goodValueRequestStub = {body: {loginForm_email_address: 'valid@example.com', loginForm_password: 'password456'}};

    /**
     * Bad Values To Test
     */
    var badValueRequestStub = {body: {loginForm_email_address: 'notavalidemailaddress', loginForm_password: ''}};
    var badValueRequestStubEmailInUse = {body: {loginForm_email_address: 'ross@persata.com', loginForm_password: ''}};
    var badValueRequestStubWithLabelTest = {body: {loginForm_email_address: 'definitelynotanemailaddress', loginForm_password: ''}};

    /**
     * Knex Instance
     */
    var knexInstance;

    /**
     * Before - Create Model and Instance
     */
    before(function(done) {
        testModelWithoutLabels = BraidsBase.Model.extend({
            name: modelName,
            fields: modelFields,
            joiValidators: modelValidators,
            customValidators: customValidators
        });
        testModel = testModelWithoutLabels.extend({
            labels: modelLabels
        });
        testModelWithoutLabelsInstance = new testModelWithoutLabels();
        testModelInstance = new testModel();
        // Knex Instance
        knexInstance = Knex.initialize({
            client: 'sqlite',
            connection: {
                filename: "test/files/test.db"
            }
        });
        done();
    });

    it('should be extendable', function(done) {
        testModel.should.be.a.Function;
        done();
    });

    it('should have properties', function(done) {
        testModelInstance.should.have.property('email_address');
        testModelInstance.should.have.property('password');
        done();
    });

    it('should have labels', function(done) {
        testModelInstance.getLabelText('email_address').should.equal('Email Address');
        testModelInstance.getLabelText('password').should.equal('Password');
        done();
    });

    it('should create humanised labels when not provided', function(done) {
        testModelWithoutLabelsInstance.getLabelText('email_address').should.equal('Email address');
        testModelWithoutLabelsInstance.getLabelText('password').should.equal('Password');
        done();
    });

    it('should provide html id & name attributes for templates', function(done) {
        testModelInstance.fieldIdentifier('email_address').should.equal(modelName + '_' + 'email_address');
        testModelInstance.fieldIdentifier('password').should.equal(modelName + '_' + 'password');
        done();
    });

    it('should provide useful container classes for templates', function(done) {
        testModelInstance.parseRequestAttributes(badValueRequestStub).validate(true).then(function(validationResult) {
            var badRequestClasses = testModelInstance.getContainerClasses('email_address', 'row');
            badRequestClasses.should.containEql('error');
            badRequestClasses.should.containEql('row');

            var badRequestClassesWithGlue = testModelInstance.getContainerClasses('email_address', 'row', ' ');
            badRequestClassesWithGlue.should.equal('row error');
            done();
        }).catch(function(e) {
            done(e);
        });
    });

    it('should validate successfully with these values', function(done) {
        testModelInstance.parseRequestAttributes(goodValueRequestStub).validate(true).then(function(validationResult) {
            validationResult.should.have.property('valid');
            validationResult.valid.should.be.true;
            done();
        }).catch(function(e) {
            done(e);
        });
    });

    it('should validate unsuccessfully with these values', function(done) {
        testModelInstance.parseRequestAttributes(badValueRequestStub).validate(true).then(function(validationResult) {
            validationResult.should.have.property('valid');
            validationResult.valid.should.be.false;
            done();
        }).catch(function(e) {
            done(e);
        });
    });

    it('should validate unsuccessfully with these values fetched via promise from the database', function(done) {
        testModelInstance.parseRequestAttributes(badValueRequestStubEmailInUse).validate(true).then(function(validationResult) {
            validationResult.should.have.property('valid');
            validationResult.valid.should.be.false;
            validationResult.errors.should.have.property('email_address');
            validationResult.errors.email_address.should.containEql('That Email Address is already in use');
            done();
        }).catch(function(e) {
            done(e);
        });
    });

    it('should have error messages for these values', function(done) {
        testModelInstance.parseRequestAttributes(badValueRequestStub).validate(true).then(function(validationResult) {
            validationResult.errors.should.be.an.Array;
            validationResult.errors.should.have.property('email_address');
            validationResult.errors.email_address.should.be.an.Array;
            validationResult.errors.email_address.should.containEql('The value of Email Address must be a valid email');
            validationResult.errors.email_address.should.containEql('That is obviously not an email address');
            testModelInstance.getErrorsForField('email_address').should.containEql('The value of Email Address must be a valid email');
            done();
        }).catch(function(e) {
            done(e);
        });
    });

    it('should parse the labels for custom validator errors', function(done) {
        testModelInstance.parseRequestAttributes(badValueRequestStubWithLabelTest).validate(true).then(function(validationResult) {
            validationResult.errors.email_address.should.containEql('That value for Email Address is not allowed');
            validationResult.errors.email_address[1].should.not.containEql('{{label}}');
            done();
        }).catch(function(e) {
            done(e);
        });
    });

    it('should parse the labels for custom validator errors on models with automatically generated labels', function(done) {
        testModelWithoutLabelsInstance.parseRequestAttributes(badValueRequestStubWithLabelTest).validate(true).then(function(validationResult) {
            validationResult.errors.email_address.should.containEql('That value for Email address is not allowed');
            validationResult.errors.email_address[1].should.not.containEql('{{label}}');
            done();
        }).catch(function(e) {
            done(e);
        });
    });

    it('should get values back from parsing the request', function(done) {
        testModelInstance.parseRequestAttributes(goodValueRequestStub).validate(true).then(function(validationResult) {
            validationResult.values.should.have.property('email_address', 'valid@example.com');
            validationResult.values.should.have.property('password', 'password456');
            testModelInstance.getFieldValue('email_address').should.equal('valid@example.com');
            done();
        }).catch(function(e) {
            done(e);
        });
    });

    it('should allow mass assigning of values from other objects with the same keys', function(done) {
        var testObject = {
            email_address: 'emailaddress@example.com',
            password: 'password987'
        };
        testModelInstance.setValues(testObject);
        testModelInstance.getValues().email_address.should.equal('emailaddress@example.com');
        testModelInstance.email_address.should.equal('emailaddress@example.com');
        testModelInstance.getValues().password.should.equal('password987');
        done();
    });
});

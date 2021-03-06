'use strict';

var BraidsBase = require('../');
var should = require('should');

describe('Braids - File Upload Functionality', function() {

    /**
     * Test Models
     */
    var testModel, testModelNotRequired, testModelWildcard, testModelEnforce;

    /**
     * Test Model Instances
     */
    var testModelInstance, testModelNotRequiredInstance, testModelWildcardInstance, testModelEnforceInstance;

    /**
     * Model Name
     * @type {string}
     */
    var modelName = 'avatarForm';

    /**
     * Model Fields
     * @type {string[]}
     */
    var modelFields = ['picture'];

    /**
     * Model Labels
     * @type {{picture: string}}
     */
    var modelLabels = {picture: 'Your Avatar Image'};

    /**
     * Model Validators
     */
    var modelValidators = {};

    /**
     * File Validators - Exact MIME-Types
     */
    var fileValidators = {
        picture: BraidsBase.FileValidator.extend({
            required: true,
            validMimeTypes: ['image/jpg', 'image/jpeg', 'image/png', 'image/gif'],
            maxFileSize: 2097152
        })
    };

    /**
     * File Validators - Not Required
     */
    var fileValidatorsNotRequiredWildcard = {
        picture: BraidsBase.FileValidator.extend({
            validMimeTypes: ['image/*'],
            maxFileSize: 2097152
        })
    };

    /**
     * File Validators - Wildcard MIME-Types
     */
    var fileValidatorsWildcard = {
        picture: BraidsBase.FileValidator.extend({
            required: true,
            validMimeTypes: ['image/*'],
            maxFileSize: '2M'
        })
    };

    /**
     * File Validators - Enforce MIME-Types
     */
    var fileValidatorsEnforce = {
        picture: BraidsBase.FileValidator.extend({
            required: true,
            validMimeTypes: ['image/*'],
            maxFileSize: '2M',
            enforceMimeMatch: true
        })
    };

    /**
     * File Upload Good Values
     */
    var fileGoodValuesRequestStub = {files: {avatarForm_picture: {name: 'me.jpg', originalFilename: 'me.jpg', path: '/var/tmp/9911-lpnc4.jpg', size: 66258, type: 'image/png'}}};
    var fileGoodValuesRequestStubCorrectMimeInspect = {files: {avatarForm_picture: {name: 'me.jpg', originalFilename: 'me.jpg', path: 'test/files/braids.jpg', size: 66258, type: 'image/jpeg'}}};

    /**
     * File Upload Bad Values
     */
    var filesBadValueRequestStubNoFile = {files: {avatarForm_picture: {name: '', originalFilename: '', path: '/var/tmp/', size: 0, type: 'application/octet-stream'}}};
    var filesBadValueRequestStubSizeIssue = {files: {avatarForm_picture: {name: 'me.jpg', originalFilename: 'me.jpg', path: '/var/tmp/9911-lpnc4.jpg', size: 3145728, type: 'image/jpeg'}}};
    var filesBadValueRequestStubInvalidType = {files: {avatarForm_picture: {name: 'you.zip', originalFilename: 'you.zip', path: '/var/tmp/9911-lpnc5.zip', size: 66258, type: 'application/zip'}}};
    var fileGoodValuesRequestStubIncorrectMimeInspect = {files: {avatarForm_picture: {name: 'braids.png', originalFilename: 'braids.png', path: 'test/files/braids.png', size: 66258, type: 'image/png'}}};

    /**
     * Before - Create Model and Instance
     */
    before(function() {
        testModel = BraidsBase.Model.Extend({
            name: modelName,
            fields: modelFields,
            labels: modelLabels,
            joiValidators: modelValidators,
            fileValidators: fileValidators
        });
        testModelNotRequired = testModel.Extend({
            fileValidators: fileValidatorsNotRequiredWildcard
        });
        testModelWildcard = testModel.Extend({
            fileValidators: fileValidatorsWildcard
        });
        testModelEnforce = testModel.Extend({
            fileValidators: fileValidatorsEnforce
        });
        testModelInstance = new testModel();
        testModelEnforceInstance = new testModelEnforce();
        testModelWildcardInstance = new testModelWildcard();
        testModelNotRequiredInstance = new testModelNotRequired();
    });

    it('should parse request files into the form values', function(done) {
        testModelInstance.parseRequestAttributes(fileGoodValuesRequestStub);
        var picture = testModelInstance.getFieldValue('picture');
        picture.should.be.an.Object;
        picture.should.have.property('name');
        picture.should.have.property('size');
        picture.should.have.property('path');
        picture.should.have.property('type');
        picture.name.should.equal('me.jpg');
        done();
    });

    it('should validate successfully for this file upload', function(done) {
        testModelInstance.parseRequestAttributes(fileGoodValuesRequestStub).validate(true).then(function(validationResult) {
            validationResult.valid.should.be.true;
            done();
        }).catch(function(e) {
            done(e);
        });
    });

    it('should validate successfully for this file upload even with no file upload', function(done) {
        testModelNotRequiredInstance.parseRequestAttributes(fileValidatorsWildcard).validate(true).then(function(validationResult) {
            validationResult.valid.should.be.true;
            done();
        }).catch(function(e) {
            done(e);
        });
    });

    it('should validate unsuccessfully for this file upload because no file was uploaded', function(done) {
        testModelInstance.parseRequestAttributes(filesBadValueRequestStubNoFile).validate(true).then(function(validationResult) {
            validationResult.valid.should.be.false;
            validationResult.errors.should.have.property('picture');
            validationResult.errors.picture.should.be.an.Array;
            validationResult.errors.picture.should.containEql('Your Avatar Image is a required field');
            done();
        }).catch(function(e) {
            done(e);
        });
    });

    it('should validate unsuccessfully for this file upload because the file was too big', function(done) {
        testModelInstance.parseRequestAttributes(filesBadValueRequestStubSizeIssue).validate(true).then(function(validationResult) {
            validationResult.valid.should.be.false;
            validationResult.errors.should.have.property('picture');
            validationResult.errors.picture.should.be.an.Array;
            validationResult.errors.picture.should.containEql('Your Avatar Image is too large - it must be smaller than 2MB');
            done();
        }).catch(function(e) {
            done(e);
        });
    });

    it('should validate unsuccessfully for this file upload because the file was an invalid type with exact types specified', function(done) {
        testModelInstance.parseRequestAttributes(filesBadValueRequestStubInvalidType).validate(true).then(function(validationResult) {
            validationResult.valid.should.be.false;
            validationResult.errors.should.have.property('picture');
            validationResult.errors.picture.should.be.an.Array;
            validationResult.errors.picture.should.containEql('Your Avatar Image must be one of the following file types: image/jpg, image/jpeg, image/png, image/gif');
            done();
        }).catch(function(e) {
            done(e);
        });
    });

    it('should validate unsuccessfully for this file upload because the file was an invalid type with wildcard type specified', function(done) {
        testModelWildcardInstance.parseRequestAttributes(filesBadValueRequestStubInvalidType).validate(true).then(function(validationResult) {
            validationResult.valid.should.be.false;
            validationResult.errors.should.have.property('picture');
            validationResult.errors.picture.should.be.an.Array;
            validationResult.errors.picture.should.containEql('Your Avatar Image must be one of the following file types: image/*');
            done();
        }).catch(function(e) {
            done(e);
        });
    });

    it('should validate successfully for this file upload with wildcard mime types', function(done) {
        testModelWildcardInstance.parseRequestAttributes(fileGoodValuesRequestStub).validate(true).then(function(validationResult) {
            validationResult.valid.should.be.true;
            done();
        }).catch(function(e) {
            done(e);
        });
    });

    it('should validate successfully for this file upload by checking its file type with file()', function(done) {
        testModelEnforceInstance.parseRequestAttributes(fileGoodValuesRequestStubCorrectMimeInspect).validate(true).then(function(validationResult) {
            validationResult.valid.should.be.true;
            done();
        }).catch(function(e) {
            done(e);
        });
    });

    it('should validate unsuccessfully for this file upload by checking its file type with file()', function(done) {
        testModelEnforceInstance.parseRequestAttributes(fileGoodValuesRequestStubIncorrectMimeInspect).validate(true).then(function(validationResult) {
            validationResult.valid.should.be.false;
            validationResult.errors.should.have.property('picture');
            validationResult.errors.picture.should.be.an.Array;
            validationResult.errors.picture.should.containEql('The file you uploaded is actually the type of image/jpeg, but the extension is of type image/png - please correct this and try uploading again');
            done();
        }).catch(function(e) {
            done(e);
        });
    });
});
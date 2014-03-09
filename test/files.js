'use strict';

var BraidsBase = require('../');
var should = require('should');

describe('Braids - File Upload Functionality', function () {

    /**
     * Test Models
     */
    var testModel;

    /**
     * Test Model Instances
     */
    var testModelInstance;

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
     * File Validators
     */
    var fileValidators = {
        picture: BraidsBase.FileValidator.extend({
            required: true,
            validMimeTypes: ['image/jpg', 'image/jpeg', 'image/png', 'image/gif']
        })
    };

    /**
     * File Upload Good Values
     */
    var fileGoodValuesRequestStub = {files: {avatarForm_picture: {name: 'me.jpg', originalFilename: 'me.jpg', path: '/var/tmp/9911-lpnc4.jpg', size: 66258, type: 'image/png'}}};

    /**
     * File Upload Bad Values
     */
    var filesBadValueRequestStubNoFile = {files: {avatarForm_picture: {name: '', originalFilename: '', path: '/var/tmp/', size: 0, type: 'application/octet-stream'}}};
    var filesBadValueRequestStubSizeIssue = {files: {avatarForm_picture: {name: 'me.jpg', originalFilename: 'me.jpg', path: '/var/tmp/9911-lpnc4.jpg', size: 3145728, type: 'image/jpeg'}}};
    var filesBadValueRequestStubInvalidType = {files: {avatarForm_picture: {name: 'you.zip', originalFilename: 'me.jpg', path: '/var/tmp/9911-lpnc4.jpg', size: 66258, type: 'application/zip'}}};

    /**
     * Before - Create Model and Instance
     */
    before(function () {
        testModel = BraidsBase.Model.Extend({
            name: modelName,
            fields: modelFields,
            labels: modelLabels,
            joiValidators: modelValidators,
            fileValidators: fileValidators
        });
        testModelInstance = new testModel();
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

    it('should validate successfully for this file upload', function (done) {
        var result = testModelInstance.parseRequestAttributes(fileGoodValuesRequestStub).validate(true);
        result.should.be.true;
        done();
    });

    it('should validate unsuccessfully for this file upload because no file was uploaded', function(done) {
        var result = testModelInstance.parseRequestAttributes(filesBadValueRequestStubNoFile).validate(true);
        var errors = testModelInstance.getAllErrors();
        result.should.be.false;
        errors.should.have.property('picture');
        errors.picture.should.be.an.Array;
        errors.picture.should.containEql('Your Avatar Image is a required field');
        done();
    });

//    it('should validate unsuccessfully for this file upload because the file was too big', function(done) {
//        var result = testModelInstance.parseRequestAttributes(filesBadValueRequestStubSizeIssue).validate(true);
//        result.should.be.false;
//        done();
//    });

    it('should validate unsuccessfully for this file upload because the file was an invalid type', function(done) {
        var result = testModelInstance.parseRequestAttributes(filesBadValueRequestStubInvalidType).validate(true);
        result.should.be.false;
        console.log(testModelInstance.getAllErrors());
        done();
    });
});
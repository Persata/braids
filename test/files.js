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
     * File Upload Good Values
     */
    var fileGoodValuesRequestStub = {files: {avatarForm_picture: {name: 'me.jpg', originalFilename: 'me.jpg', path: '/var/tmp/9911-lpnc4.jpg', size: 66258, type: 'image/png'}}};

    /**
     * File Upload Bad Values
     */
    var filesBadValueRequestStubNoFile = {files: {}};
    var filesBadValueRequestStubSizeIssue = {files: {}};
    var filesBadValueRequestStubInvalidType = {files: {}};

    /**
     * Before - Create Model and Instance
     */
    before(function () {
        testModel = BraidsBase.Model.Extend({
            name: modelName,
            fields: modelFields,
            labels: modelLabels,
            joiValidators: modelValidators
        });
        testModelInstance = new testModel();
    });

    it('should validate successfully for this file upload', function (done) {
        var result = testModelInstance.parseRequestAttributes(fileGoodValuesRequestStub).validate(true);
        console.log(result);
        console.log(testModelInstance.getAllErrors());
        result.should.be.true;
        done();
    });

    it('should validate unsuccessfully for this file upload because no file was uploaded', function(done) {
        var result = testModelInstance.parseRequestAttributes(fileGoodValuesRequestStub).validate(true);
        result.should.be.false;
        done();
    });

    it('should validate unsuccessfully for this file upload because the file was too big', function(done) {
        var result = testModelInstance.parseRequestAttributes(fileGoodValuesRequestStub).validate(true);
        result.should.be.false;
        done();
    });

    it('should validate unsuccessfully for this file upload because the file was an invalid type', function(done) {
        var result = testModelInstance.parseRequestAttributes(fileGoodValuesRequestStub).validate(true);
        result.should.be.false;
        done();
    });
});
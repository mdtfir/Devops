const { describe, it } = require('mocha');
const { expect } = require('chai');
const { app, server } = require('../index');
const Student = require('../models/Student');
const sinon = require('sinon');
const sharp = require('sharp');
const chai = require('chai');
const chaiHttp = require('chai-http');
chai.use(chaiHttp);
let baseUrl;

describe('Resource API', () => {
    before(async () => {
        const { address, port } = await server.address();
        baseUrl = `http://${address == '::' ? 'localhost' : address}:${port}`;
    });

    after(() => {
        return new Promise((resolve) => {
            server.close(() => resolve());
        });
    });

    describe('PUT /update-student', () => {

        it('Should update ALL fields successfully', function (done) {
            this.timeout(10000); // Set a timeout of 10 seconds for this specific test
        
            const updateData = {
                adminNumber: '1234567A',  // Admin number
                name: 'Updated Name',      // Updated student name
                diploma: 'Diploma in Business', // Updated diploma
                cGPA: 3.5,                // Updated cGPA
                image: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAgAAAAIAQMAAAD+wSzIAAAABlBMVEX///+/v7+jQ3Y5AAAADklEQVQI12P4AIX8EAgALgAD/aNpbtEAAAAASUVORK5CYII"
            };
        
            chai
                .request(baseUrl)
                .put('/update-student') // PUT request to update student data
                .send(updateData) // Sending data in the body
                .end((err, res) => { // Use .end to handle the response asynchronously
                    // Check for errors in the response
                    if (err) return done(err);
        
                    // Assert that the response has a status of 200
                    expect(res).to.have.status(200);
        
                    // Assert that the message is as expected
                    expect(res.body.message).to.equal('Student updated successfully');
        
                    // Assert that the response data matches the updated values
                    expect(res.body.student.name).to.equal(updateData.name);
                    expect(res.body.student.diploma).to.equal(updateData.diploma);
        
                    // Convert the cGPA returned by the server to a string for comparison
                    expect(res.body.student.cGPA["$numberDecimal"]).to.equal(updateData.cGPA.toString()); // cGPA is stored as Decimal128
        
                    expect(res.body.student.image).to.equal(updateData.image);
        
                    done(); // Indicate that the test is complete
                });
        });

        
        it('Should return an error for a non-square image', function (done) {
            // Base64 of an image with unequal width and height
            const nonSquareImage = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAUCAIAAAA7jDsBAAAAHElEQVR4nGJps/7HgBsw4ZEblR6VJkkaEAAA//9w+gHqtc02WQAAAABJRU5ErkJggg=="

            const updateData = {
                adminNumber: '1234567A',
                name: 'Test Name',
                diploma: 'Diploma in IT',
                cGPA: 3.0,
                image: nonSquareImage,
            };
        
            chai
                .request(baseUrl)
                .put('/update-student')
                .send(updateData)
                .end((err, res) => {
                    // Ensure the response status is 400
                    expect(res).to.have.status(400);
        
                    // Ensure the error message matches
                    expect(res.body.message).to.equal('Image must be square (equal width and height).');
                    done();
                });
        });

        it('Should return an error if there is an issue processing the image with sharp', function (done) {
            // Invalid image data that cannot be processed by sharp
            const corruptImage = "data:image/png;base64,AAAAAA";
        
            const updateData = {
                adminNumber: '1234567A',
                name: 'Test Name',
                diploma: 'Diploma in IT',
                cGPA: 3.0,
                image: corruptImage,
            };
        
            chai
                .request(baseUrl)
                .put('/update-student')
                .send(updateData)
                .end((err, res) => {
                    // Ensure the response status is 400
                    expect(res).to.have.status(400);
        
                    // Ensure the error message matches
                    expect(res.body.message).to.equal('Invalid image data or format');
                    done();
                });
        });
        
        it('Should return an error if there is an issue with buffering the data', function (done) {
            const notBase64Image = "data:image/png;base64,";
        
            const updateData = {
                adminNumber: '1234567A',
                name: 'Test Name',
                diploma: 'Diploma in IT',
                cGPA: 3.0,
                image: notBase64Image,
            };
        
            chai
                .request(baseUrl)
                .put('/update-student')
                .send(updateData)
                .end((err, res) => {
                    // Ensure the response status is 400
                    expect(res).to.have.status(400);
        
                    // Ensure the error message matches
                    expect(res.body.message).to.equal('Unable to buffer base64 data');
                    done();
                });
        });

        it('Should update SOME fields successfully and leave unchanged fields intact', async () => {
            const adminNumber = '1234567A';

            // Query the database to get the original student data
            const originalData = await Student.findOne({ adminNumber }).lean();

            // Ensure the student exists
            expect(originalData).to.not.be.null;

            const updateData = {
                adminNumber,
                diploma: 'Diploma in Big Data Analytics', // Updated diploma
                cGPA: 3.7, // Updated cGPA
            };

            const res = await chai
                .request(baseUrl)
                .put('/update-student') // PUT request to update student data
                .send(updateData); // Sending data in the body

            // Assert that the response has a status of 200
            expect(res).to.have.status(200);

            // Assert that the message is as expected
            expect(res.body.message).to.equal('Student updated successfully');

            // Assert that the updated fields have changed
            expect(res.body.student.diploma).to.equal(updateData.diploma);
            expect(res.body.student.cGPA["$numberDecimal"]).to.equal(updateData.cGPA.toString()); // cGPA is stored as Decimal128

            // Assert that the unchanged fields remain the same
            expect(res.body.student.name).to.equal(originalData.name); // Ensure name is unchanged
            expect(res.body.student.image).to.equal(originalData.image); // Ensure image is unchanged
        });

        it('Should update a single field and leave others unchanged', async () => {
            const adminNumber = '1234567A';
            const updateData = {
                adminNumber,
                name: 'New Name', // Update only the name
            };

            const originalData = await Student.findOne({ adminNumber }).lean();

            const res = await chai.request(baseUrl).put('/update-student').send(updateData);

            expect(res).to.have.status(200);
            expect(res.body.student.name).to.equal(updateData.name);
            expect(res.body.student.diploma).to.equal(originalData.diploma); // Unchanged
            expect(res.body.student.cGPA["$numberDecimal"]).to.equal(originalData.cGPA.toString());
            expect(res.body.student.image).to.equal(originalData.image); // Unchanged
        });

        it('should return 400 if adminNumber is missing', (done) => {
            const updateData = {
                name: 'Updated Name',
                diploma: 'Diploma in Data Science',
                cGPA: 3.8,
            };

            chai
                .request(baseUrl)
                .put('/update-student')
                .send(updateData)
                .end((err, res) => {
                    if (err) return done(err);

                    expect(res).to.have.status(400);
                    expect(res.body.message).to.equal('Admin number is required');
                    done();
                });
        });

        it('should return 400 if adminNumber format is invalid', (done) => {
            const updateData = {
                adminNumber: 'invalidAdmin123', // Invalid admin number format
                name: 'Invalid Admin',
                diploma: 'Diploma in Invalid Format',
                cGPA: 3.5,
            };

            chai
                .request(baseUrl)
                .put('/update-student')
                .send(updateData)
                .end((err, res) => {
                    if (err) return done(err);

                    expect(res).to.have.status(400);
                    expect(res.body.message).to.equal('Invalid admin number format');
                    done();
                });
        });

        it('Should return 400 if no update fields are provided', (done) => {
            const updateData = {
                adminNumber: '1234567A', // Only adminNumber is provided
            };

            chai
                .request(baseUrl)
                .put('/update-student')
                .send(updateData)
                .end((err, res) => {
                    expect(res).to.have.status(400);
                    expect(res.body.message).to.equal('No data provided for update');
                    done();
                });
        });

        it('Should return 404 when updating a nonexistent student', (done) => {
            const updateData = {
                adminNumber: '9999999Z', // Nonexistent admin number
                diploma: 'Diploma in Cybersecurity',
            };

            chai
                .request(baseUrl)
                .put('/update-student')
                .send(updateData)
                .end((err, res) => {
                    expect(res).to.have.status(404);
                    expect(res.body.message).to.equal('Student not found');
                    done();
                });
        });

        it('Should return 400 for invalid cGPA value', (done) => {
            const updateData = {
                adminNumber: '1234567A',
                cGPA: 'invalid_cgpa', // Invalid cGPA
            };

            chai
                .request(baseUrl)
                .put('/update-student')
                .send(updateData)
                .end((err, res) => {
                    expect(res).to.have.status(400);
                    expect(res.body.message).to.include('Invalid cGPA value');
                    done();
                });
        });

        it('Should return 400 for a negative cGPA value', (done) => {
            const updateData = {
                adminNumber: '1234567A',
                cGPA: -1.6, // Invalid cGPA
            };

            chai
                .request(baseUrl)
                .put('/update-student')
                .send(updateData)
                .end((err, res) => {
                    expect(res).to.have.status(400);
                    expect(res.body.message).to.include('cGPA value must be greater than or equal to 0.');
                    done();
                });
        });

        it('Should return 400 for a cGPA value higher than 4', (done) => {
            const updateData = {
                adminNumber: '1234567A',
                cGPA: 5.0, // Invalid cGPA
            };

            chai
                .request(baseUrl)
                .put('/update-student')
                .send(updateData)
                .end((err, res) => {
                    expect(res).to.have.status(400);
                    expect(res.body.message).to.include('cGPA value must be less than or equal to 4.0.');
                    done();
                });
        });

        it('Should return 400 for invalid image URL', (done) => {
            const updateData = {
                adminNumber: '1234567A',
                image: 'invalid-url', // Invalid URL format
            };

            chai
                .request(baseUrl)
                .put('/update-student')
                .send(updateData)
                .end((err, res) => {
                    expect(res).to.have.status(400);
                    expect(res.body.message).to.include('Invalid base64 image format');
                    done();
                });
        });

        it('Should fail nonexistent fields in the update request', async () => {
            const updateData = {
                adminNumber: '1234567A',
                nonexistentField: 'someValue', // Invalid field
            };

            const res = await chai.request(baseUrl).put('/update-student').send(updateData);

            expect(res).to.have.status(400);
            expect(res.body).to.have.property('message'); // Error message is expected
            expect(res.body.message).to.include('Invalid fields'); // Match the specific error message
        });

        it('Should fail with a large name payload', (done) => {
            const updateData = {
                adminNumber: '1234567A',
                name: 'A'.repeat(1000), // Long name
                diploma: 'Diploma in Big Data Analytics',
                cGPA: 4.0,
            };

            chai
                .request(baseUrl)
                .put('/update-student')
                .send(updateData)
                .end((err, res) => {
                    expect(res).to.have.status(400);
                    expect(res.body.message).to.include('Name exceeds maximum length of 255 characters');
                    done();
                });
        });

    });
});

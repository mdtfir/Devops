const Student = require('../models/Student'); // Adjust the path if necessary
const sharp = require('sharp'); // Image processing library

async function updateStudent(req, res) {
    const { adminNumber, name, diploma, cGPA, image, ...extraFields } = req.body;

    try {
        // Prepare update object dynamically based on provided fields
        const updateFields = {};

        if (!adminNumber) {
            console.log("Admin number is required.");
            return res.status(400).json({ message: 'Admin number is required' });
        }

        const adminNumberRegex = /^[0-9]{7}[A-Za-z]$/;
        if (!adminNumberRegex.test(adminNumber)) {
            console.log("Invalid admin number format:", adminNumber);
            return res.status(400).json({ message: 'Invalid admin number format' });
        }
        console.log("Admin number format is valid.");
        updateFields.adminNumber = adminNumber;

        const allowedFields = ['name', 'diploma', 'cGPA', 'image'];
        const invalidFields = Object.keys(extraFields).filter(
            (field) => !allowedFields.includes(field)
        );

        if (invalidFields.length > 0) {
            console.log("Invalid fields provided:", invalidFields);
            return res.status(400).json({ message: `Invalid fields: ${invalidFields.join(', ')}` });
        }
        console.log("No invalid fields detected.");

        // Only proceed to update if there is data provided
        if (!name && !diploma && !cGPA && !image) {
            console.log("No data provided for update.");
            return res.status(400).json({ message: 'No data provided for update' });
        }

        // Validate and update fields
        if (name) {
            if (name.length > 255) {
                console.log("Name exceeds maximum length:", name.length);
                return res.status(400).json({ message: 'Name exceeds maximum length of 255 characters' });
            }
            console.log("Name is valid.");
            updateFields.name = name;
        }

        if (diploma) {
            console.log("Diploma provided:", diploma);
            updateFields.diploma = diploma;
        }

        if (cGPA) {
            const parsedCGPA = parseFloat(cGPA);
        
            // Check if cGPA is a valid float
            if (isNaN(parsedCGPA)) {
                console.log("Invalid cGPA value:", cGPA);
                return res.status(400).json({ message: 'Invalid cGPA value. Must be a number.' });
            }
        
            // Check if cGPA is within the valid range
            if (parsedCGPA < 0) {
                console.log("cGPA is below the minimum value of 0:", parsedCGPA);
                return res.status(400).json({ message: 'cGPA value must be greater than or equal to 0.' });
            }
        
            if (parsedCGPA > 4.0) {
                console.log("cGPA exceeds the maximum value of 4.0:", parsedCGPA);
                return res.status(400).json({ message: 'cGPA value must be less than or equal to 4.0.' });
            }
        
            console.log("cGPA is valid:", parsedCGPA);
            updateFields.cGPA = parsedCGPA;
        }
        

        if (image) {
            console.log("Image data provided.");
            try {
                const base64Regex = /^data:image\/([a-zA-Z]+);base64,/;
                const matches = base64Regex.exec(image);

                if (!matches) {
                    console.log("Invalid base64 image format.");
                    return res.status(400).json({ message: 'Invalid base64 image format' });
                }
                console.log("Base64 format is valid.");

                const imageType = matches[1];
                console.log("Image type detected:", imageType);

                const imageData = image.split(',')[1];
                console.log("Extracted base64 image data.");

                const buffer = Buffer.from(imageData, 'base64');
                console.log("Base64 decoded into a buffer.");

                if (!Buffer.isBuffer(buffer) || buffer.length === 0) {
                    console.log("Buffer is empty or invalid.");
                    return res.status(400).json({ message: 'Unable to buffer base64 data' });
                }

                console.log("Buffer valid for image data.");

                // Validate the image using sharp
                const { width, height, format } = await sharp(buffer).metadata();
                console.log(`Image metadata: width=${width}, height=${height}, format=${format}`);

                // Validate format
                if (!['png', 'jpeg', 'jpg', 'gif', 'webp'].includes(format)) {
                    console.log("Unsupported image format:", format);
                    return res.status(400).json({ message: 'Unsupported image format' });
                }

                // Validate dimensions
                if (width !== height) {
                    console.log("Image is not square:", `width=${width}, height=${height}`);
                    return res.status(400).json({ message: 'Image must be square (equal width and height).' });
                }

                console.log("Image passed all validation checks.");
                updateFields.image = image;

            } catch (error) {
                console.error("Error processing image with sharp:", error.message);
                return res.status(400).json({ message: 'Invalid image data or format' });
            }
        }

        console.log("Update fields prepared:", updateFields);

        // Perform the update
        const student = await Student.findOneAndUpdate(
            { adminNumber },
            updateFields,
            { new: true } // Return the updated document
        );

        if (!student) {
            console.log("Student not found with admin number:", adminNumber);
            return res.status(404).json({ message: 'Student not found' });
        }

        console.log("Student updated successfully:", student);
        res.status(200).json({
            message: 'Student updated successfully',
            student
        });
    } catch (error) {
        console.error("Error updating student:", error.message);
        res.status(500).json({ message: 'Error updating student: ' + error.message });
    }
}

module.exports = updateStudent;

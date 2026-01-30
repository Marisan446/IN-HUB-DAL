// Defining the common class that holds utility functions
module.exports = class common {

    // Method to generate a standardized output object
    generateOutput(data, status, message) {
        
        // Constructing an object with the given parameters
        let output = {
            data: data,      // Data returned by the operation
            status: status,  // HTTP status code or operation status
            message: message // Message describing the result of the operation
        }
        
        // Returning the output object
        return output;
    }

}

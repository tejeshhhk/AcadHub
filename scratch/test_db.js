
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, 'server', '.env') });

const testURIs = [
    process.env.MONGO_URI,
    'mongodb+srv://akshatjain:akshatjain@ac@cluster0.yzpocwp.mongodb.net/academic-platform?retryWrites=true&w=majority',
    'mongodb+srv://akshatjain:akshatjain@cluster0.yzpocwp.mongodb.net/academic-platform?retryWrites=true&w=majority'
];

async function runTests() {
    for (let uri of testURIs) {
        console.log(`Testing URI: ${uri.replace(/:.+@/, ':****@')}`);
        try {
            await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
            console.log('✅ Success!');
            await mongoose.disconnect();
            break;
        } catch (err) {
            console.log(`❌ Failed: ${err.message}`);
        }
    }
}

runTests();

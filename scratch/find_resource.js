const mongoose = require('mongoose');
const Resource = require('../server/models/Resource');

mongoose.connect('mongodb+srv://Tejuu:Tejuukadiyam@cluster.pyws8do.mongodb.net/acudhub')
    .then(async () => {
        const resources = await Resource.find().sort({createdAt: -1}).limit(1);
        console.log(JSON.stringify(resources.map(r => ({id: r._id, title: r.title, type: r.fileType, url: r.fileUrl})), null, 2));
        mongoose.disconnect();
    })
    .catch(console.error);

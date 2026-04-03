const { Jimp } = require('jimp');
const jsQR = require('jsqr');
const fs = require('fs');

async function test() {
    try {
        const data = Buffer.alloc(100 * 100 * 4); // Fake blank image
        const image = await Jimp.read(data);
        console.log("Image data exists:", !!image.bitmap.data);
        const code = jsQR(new Uint8ClampedArray(image.bitmap.data), image.bitmap.width, image.bitmap.height);
        console.log("jsQR ran successfully. Result:", !!code);
    } catch(err) {
        console.log("Error:", err);
    }
}
test();

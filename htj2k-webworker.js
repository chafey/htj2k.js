self.importScripts('openjphjs.js');
console.log('worker started')

let decoder

let queue = []

Module.onRuntimeInitialized = async _ => {
    console.log('HTJ2K Initialized')
    decoder = new Module.HTJ2KDecoder();
    //postMessage({initialized: true})

    const queuedJobs = queue
    queue = []
    queuedJobs.forEach((d) => {
        decode(d)
    })
}

function decode(encodedBitStream) {
    console.log('decode',encodedBitStream )

    // Setup
    const encodedBuffer = decoder.getEncodedBuffer(encodedBitStream.length);
    encodedBuffer.set(encodedBitStream);

    // Get header
    decoder.readHeader();

    // Decode
    decoder.decode();

    const frameInfo = decoder.getFrameInfo();

    // Display Image
    var decodedBuffer = decoder.getDecodedBuffer();

    const decodedBufferCopy = decodedBuffer.slice()

    postMessage([decodedBufferCopy.buffer, frameInfo]);
}


onmessage = function(e) {
    console.log('Message received from main script', e.data);
    
    if(decoder === undefined) {
        console.log('HTJ2K not initilized yet, queueing')
        queue.push(new Uint8Array(e.data[0]))
        return
    }

    const encodedBitStream = new Uint8Array(e.data[0])
    decode(encodedBitStream)
  }
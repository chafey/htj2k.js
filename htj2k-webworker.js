self.importScripts('openjphjs.js');
//console.log('worker started')

let decoder

let queuedTasks = []

Module.onRuntimeInitialized = async _ => {
    //console.log('HTJ2K Initialized')
    decoder = new Module.HTJ2KDecoder();

    // process any queued jobs
    const tasks = queuedTasks
    queuedTasks = []
    tasks.forEach((task) => {
        decode(task)
    })
}

function decode(task) {

    //console.log('decode',encodedBitStream )

    // Setup
    const startDecode = new Date()
    const encodedBuffer = decoder.getEncodedBuffer(task.data.length);
    encodedBuffer.set(task.data);

    // Get header
    decoder.readHeader();

    // Decode
    decoder.decode();

    const frameInfo = decoder.getFrameInfo();

    // Display Image
    var decodedBuffer = decoder.getDecodedBuffer();

    // Convert decoded pixel data to an ImageData object
    const numPixels = frameInfo.width * frameInfo.height
    const u8c = new Uint8ClampedArray(numPixels * 4)
    for(z = 0; z < numPixels; z++) {
        u8c[z * 4] = decodedBuffer[z *3]
        u8c[z * 4 + 1] = decodedBuffer[z *3 + 1]
        u8c[z * 4 + 2] = decodedBuffer[z *3 + 2]
        u8c[z * 4 + 3] = 255
    }
    const imgData = new ImageData(u8c, frameInfo.width, frameInfo.height);
    const endDecode = new Date()
    const decodeDuration = endDecode - startDecode
    postMessage([imgData, frameInfo, task.requestId, task.fetchDuration, decodeDuration]);
}


onmessage = function(e) {
    //console.log('Message received from main script', e.data);
    
    const startFetch = new Date()

    fetch(e.data.src).then((res) => {
        return res.arrayBuffer()
    }).then((res) => {
        const endFetch = new Date()
        const fetchDuration = endFetch - startFetch

        const task = {
            data: new Uint8Array(res),
            requestId: e.data.requestId,
            fetchDuration
        }

        if(decoder === undefined) {
            //console.log('HTJ2K not initilized yet, queueing')
            queuedTasks.push(task)
        } else {
            decode(task)
        }
    })
  }
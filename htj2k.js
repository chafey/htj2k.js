(function () {
    console.log('starting worker')
    const worker = new Worker('htj2k-webworker.js');

    function imgDataToURL(img, imgData) {
      var canvas = document.createElement('canvas');
      canvas.width = imgData.width;
      canvas.height = imgData.height;
      canvas.getContext('2d').putImageData(imgData, 0, 0);
      img.style.backgroundImage = 'url("' + canvas.toDataURL() + '")';
    }
  
    async function imgDataToCanvas(img, imgData) {
      console.log('imgData', imgData)
      const canvas = document.createElement('canvas');
      canvas.width = img.width === 1 ? imgData.width : img.width;
      canvas.height = img.height === 1 ? imgData.height : img.height;
      canvas.className = img.className;
      canvas.id = img.id;
      canvas.title = img.title;
      canvas.dataset.jxlSrc = img.dataset.jxlSrc;
      const imgBitmap = await window.createImageBitmap(imgData, {resizeWidth: canvas.width, resizeHeight: canvas.height});
      canvas.getContext('2d').drawImage(imgBitmap, 0, 0);
      img.replaceWith(canvas);
    }
  
    async function decode(img, isCSS) {
        console.log('decode' , img)
      const jxlSrc = isCSS ? getComputedStyle(img).backgroundImage.slice(5, -2) : (img.dataset.jxlSrc = img.currentSrc);
      img.src = 'data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw=='; // blank 1x1 image
      const res = await fetch(jxlSrc);
      const image = await res.arrayBuffer();
      worker.postMessage([image]);
      worker.onmessage = (e) => {
        const decodedBuffer = new Uint8Array(e.data[0])
        console.log('decodedBuffer', decodedBuffer)
        const frameInfo = e.data[1]
        console.log(frameInfo)
        const numPixels = frameInfo.width * frameInfo.height
        const u8c = new Uint8ClampedArray(numPixels * 4)
        for(z = 0; z < numPixels; z++) {
            u8c[z * 4] = decodedBuffer[z *3]
            u8c[z * 4 + 1] = decodedBuffer[z *3 + 1]
            u8c[z * 4 + 2] = decodedBuffer[z *3 + 2]
            u8c[z * 4 + 3] = 255
        }
        console.log('u8c', u8c)
        const imgData = new ImageData(u8c, frameInfo.width, frameInfo.height);
        console.log(imgData)
        requestAnimationFrame(() => isCSS ? imgDataToURL(img, imgData) : imgDataToCanvas(img, imgData));
      }
    }
  
    new MutationObserver(mutations => {
      mutations.forEach(mutation => {
        Array.prototype.filter.call(mutation.addedNodes,
          el => (el instanceof HTMLImageElement && el.src.endsWith('.j2c')) || (el instanceof Element && getComputedStyle(el).backgroundImage.endsWith('.j2c")')))
        .forEach(el => {
          if (el instanceof HTMLImageElement)
            el.onerror = () => decode(el, false);
          else
            decode(el, true);
        });
      });
    }).observe(document.documentElement, {subtree: true, childList: true});
  })();
  
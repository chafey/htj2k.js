(function () {
    //console.log('starting worker')
   
    const requestMap = {}
    let nextRequest = 1

    const worker = new Worker('htj2k-webworker.js');
    worker.onmessage = (e) => {
        const imgData = e.data[0]
        const frameInfo = e.data[1]
        const requestId = e.data[2]
        const req = requestMap[requestId]
        const fetchDuration = e.data[3]
        const decodeDuration = e.data[4]
        //console.log('Fetch', fetchDuration, 'Decode', decodeDuration)
        //console.log(frameInfo)
        requestAnimationFrame(() => req.isCSS ? imgDataToURL(req.img, imgData) : imgDataToCanvas(req.img, imgData));
    }

    function imgDataToURL(img, imgData) {
      var canvas = document.createElement('canvas');
      canvas.width = imgData.width;
      canvas.height = imgData.height;
      canvas.getContext('2d').putImageData(imgData, 0, 0);
      img.style.backgroundImage = 'url("' + canvas.toDataURL() + '")';
    }
  
    async function imgDataToCanvas(img, imgData) {
      const canvas = document.createElement('canvas');
      canvas.width = img.width === 1 ? imgData.width : img.width;
      canvas.height = img.height === 1 ? imgData.height : img.height;
      const imgBitmap = await window.createImageBitmap(imgData, {resizeWidth: canvas.width, resizeHeight: canvas.height});
      canvas.getContext('2d').drawImage(imgBitmap, 0, 0);
      const dataUrl = canvas.toDataURL()
      img.src = dataUrl
      // TODO: delete canvas
    }
  
    function decode(img, isCSS) {
        const src = isCSS ? getComputedStyle(img).backgroundImage.slice(5, -2) : img.currentSrc;
        img.src = 'data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw=='; // blank 1x1 image
        const requestId = nextRequest++
        requestMap[requestId] = {
            img,
            isCSS
        }
        worker.postMessage({src, requestId});
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
  
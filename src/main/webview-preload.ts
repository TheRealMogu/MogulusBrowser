// Runs in webview page context (contextIsolation=no) — overrides JS fingerprinting APIs
;(function () {
  // ── Canvas noise ──────────────────────────────────────────────────────────────
  const origToDataURL = HTMLCanvasElement.prototype.toDataURL
  HTMLCanvasElement.prototype.toDataURL = function (type?: string, quality?: number) {
    const ctx = this.getContext('2d')
    if (ctx && this.width > 0 && this.height > 0) {
      const img = ctx.getImageData(0, 0, this.width, this.height)
      for (let i = 0; i < img.data.length; i += 4) {
        img.data[i]     ^= (Math.floor(Math.random() * 3) - 1) & 0xff
        img.data[i + 1] ^= (Math.floor(Math.random() * 3) - 1) & 0xff
        img.data[i + 2] ^= (Math.floor(Math.random() * 3) - 1) & 0xff
      }
      ctx.putImageData(img, 0, 0)
    }
    return origToDataURL.call(this, type, quality)
  }

  const origToBlob = HTMLCanvasElement.prototype.toBlob
  HTMLCanvasElement.prototype.toBlob = function (callback, type?, quality?) {
    const noisy = document.createElement('canvas')
    noisy.width = this.width
    noisy.height = this.height
    const nc = noisy.getContext('2d')
    if (nc && this.width > 0 && this.height > 0) {
      nc.drawImage(this, 0, 0)
      const img = nc.getImageData(0, 0, this.width, this.height)
      for (let i = 0; i < img.data.length; i += 4) {
        img.data[i]     ^= (Math.floor(Math.random() * 3) - 1) & 0xff
        img.data[i + 1] ^= (Math.floor(Math.random() * 3) - 1) & 0xff
        img.data[i + 2] ^= (Math.floor(Math.random() * 3) - 1) & 0xff
      }
      nc.putImageData(img, 0, 0)
      origToBlob.call(noisy, callback, type, quality)
    } else {
      origToBlob.call(this, callback, type, quality)
    }
  }

  // ── WebGL renderer spoofing ───────────────────────────────────────────────────
  const WEBGL_VENDOR   = 0x9245 // UNMASKED_VENDOR_WEBGL
  const WEBGL_RENDERER = 0x9246 // UNMASKED_RENDERER_WEBGL

  function patchWebGLContext(ctx: WebGLRenderingContext | WebGL2RenderingContext) {
    const orig = ctx.getParameter.bind(ctx)
    ;(ctx as WebGLRenderingContext).getParameter = function (pname: number) {
      if (pname === WEBGL_VENDOR)   return 'Intel Open Source Technology Center'
      if (pname === WEBGL_RENDERER) return 'Mesa DRI Intel(R) HD Graphics'
      return orig(pname)
    }
  }

  const origGetContext = HTMLCanvasElement.prototype.getContext
  // @ts-ignore
  HTMLCanvasElement.prototype.getContext = function (type: string, attrs?: unknown) {
    const ctx = origGetContext.call(this, type, attrs)
    if (ctx && (type === 'webgl' || type === 'experimental-webgl' || type === 'webgl2')) {
      patchWebGLContext(ctx as WebGLRenderingContext)
    }
    return ctx
  }

  // ── AudioContext noise ────────────────────────────────────────────────────────
  const ACtx = (window as unknown as Record<string, unknown>)['AudioContext'] ||
               (window as unknown as Record<string, unknown>)['webkitAudioContext'] as typeof AudioContext | undefined
  if (ACtx) {
    const origCreateAnalyser = (ACtx as typeof AudioContext).prototype.createAnalyser
    ;(ACtx as typeof AudioContext).prototype.createAnalyser = function () {
      const analyser = origCreateAnalyser.call(this)
      const origGetFloat = analyser.getFloatFrequencyData.bind(analyser)
      analyser.getFloatFrequencyData = function (arr: Float32Array<ArrayBuffer>) {
        origGetFloat(arr)
        for (let i = 0; i < arr.length; i++) arr[i] += Math.random() * 0.02 - 0.01
      }
      return analyser
    }
  }
})()

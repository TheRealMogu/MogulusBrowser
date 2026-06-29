// Embedded tracker/ad domain blocklist — subset of EasyList + EasyPrivacy
// Updated manually; replace with filesystem-loaded EasyList for production.
export const TRACKER_DOMAINS: Set<string> = new Set([
  // Google Ads & Analytics
  'google-analytics.com','www.google-analytics.com','ssl.google-analytics.com',
  'analytics.google.com','googletagmanager.com','www.googletagmanager.com',
  'googletagservices.com','doubleclick.net','ad.doubleclick.net','fls.doubleclick.net',
  'stats.g.doubleclick.net','googleadservices.com','www.googleadservices.com',
  'googlesyndication.com','pagead2.googlesyndication.com','tpc.googlesyndication.com',
  'adservice.google.com','adservice.google.de','adservice.google.fr',
  'adservice.google.co.uk','adservice.google.it','adservice.google.es',
  'adservice.google.com.br','adservice.google.com.au','adservice.google.co.jp',
  'apis.google.com', // Note: also used for Maps/Fonts, but often fingerprinting

  // Facebook / Meta
  'facebook.net','connect.facebook.net','www.facebook.com',
  'graph.facebook.com','an.facebook.com','staticxx.facebook.com',
  'atdmt.com',

  // Twitter / X
  'ads.twitter.com','analytics.twitter.com','t.co',
  'ads-api.twitter.com','syndication.twitter.com','platform.twitter.com',
  'static.ads-twitter.com',

  // Microsoft / Bing Ads
  'bat.bing.com','c.bing.com','clarity.ms','www.clarity.ms',
  'msads.net','ads.msn.com','flex.msn.com','rad.msn.com',

  // Amazon Advertising
  'amazon-adsystem.com','s.amazon-adsystem.com','aax.amazon-adsystem.com',
  'z-na.amazon-adsystem.com','assoc-amazon.com','affiliate-program.amazon.com',
  'c.amazon-adsystem.com','d.amazon-adsystem.com','ir-na.amazon-adsystem.com',
  'mads.amazon.com',

  // LinkedIn
  'snap.licdn.com','ads.linkedin.com','px.ads.linkedin.com','dc.ads.linkedin.com',
  'platform.linkedin.com',

  // Pinterest
  'ct.pinterest.com','ads.pinterest.com','log.pinterest.com',

  // TikTok
  'analytics.tiktok.com','ads.tiktok.com','business-api.tiktok.com',
  'log.tiktokv.com','mcs.zijieapi.com',

  // Snap
  'tr.snapchat.com','sc-static.net','businesshelp.snapchat.com',

  // Adobe Analytics / Experience Cloud
  'demdex.net','omtrdc.net','2o7.net','everesttech.net','omniture.com',
  'adobedtm.com','sc.omtrdc.net','stats.adobe.com',

  // Criteo
  'criteo.com','criteo.net','hlserve.com','gum.criteo.com','sslwidget.criteo.com',
  'dis.us.criteo.com','dis.eu.criteo.com','widget.criteo.com',

  // AppNexus / Xandr
  'adnxs.com','ib.adnxs.com','cdn.adnx.com','nym1.ib.adnxs.com',

  // The Trade Desk
  'adsrvr.org','match.adsrvr.org','cm.adsrvr.org','insight.adsrvr.org',

  // Taboola
  'taboola.com','cdn.taboola.com','trc.taboola.com','s1.taboola.com',
  'images.taboola.com',

  // Outbrain
  'outbrain.com','widgets.outbrain.com','log.outbrain.com',
  'amplify.outbrain.com','traffic.outbrain.com',

  // Quantcast
  'quantserve.com','quantcast.com','edge.quantserve.com','p.quantcount.com',

  // OpenX
  'openx.net','openx.com','delivery.oxgt.com',

  // Rubicon / Magnite
  'rubiconproject.com','fastlane.rubiconproject.com','magnite.com',
  'prebid.rubiconproject.com',

  // PubMatic
  'pubmatic.com','image8.pubmatic.com','aktrack.pubmatic.com',

  // Index Exchange
  'casalemedia.com','indexww.com','as.casalemedia.com',

  // Sovrn / Lijit
  'lijit.com','sovrn.com','beacon.lijit.com',

  // TripleLift
  '3lift.com','tlnk.io','tlvmedia.com',

  // Lotame
  'crwdcntrl.net','lotame.com','ad.crwdcntrl.net',

  // Zemanta
  'zemanta.com',

  // Sizmek
  'sizmek.com','serving.sizmek.com',

  // Yandex Metrika
  'mc.yandex.ru','metrika.yandex.ru','mc.webvisor.ru','mc.webvisor.org',
  'yastatic.net',

  // Baidu Analytics
  'hm.baidu.com',

  // Analytics & Tracking
  'hotjar.com','script.hotjar.com','static.hotjar.com','insights.hotjar.com',
  'mixpanel.com','api.mixpanel.com','cdn.mxpnl.com',
  'amplitude.com','cdn.amplitude.com','api.amplitude.com','api2.amplitude.com',
  'segment.com','cdn.segment.com','api.segment.io','cdn.segment.io',
  'heap.io','heapanalytics.com','cdn.heapanalytics.com',
  'fullstory.com','rs.fullstory.com','edge.fullstory.com',
  'mouseflow.com','cdn.mouseflow.com',
  'crazyegg.com','script.crazyegg.com',
  'logrocket.com','cdn.lr-intake.com','r.lr-intake.com',
  'optimizely.com','cdn.optimizely.com','logx.optimizely.com',
  'visualwebsiteoptimizer.com','dev.visualwebsiteoptimizer.com',
  'chartbeat.com','static.chartbeat.com','ping.chartbeat.net',
  'scorecardresearch.com','beacon.scorecardresearch.com',
  'newrelic.com','bam.nr-data.net','js-agent.newrelic.com',
  'nr-data.net',
  'appsflyer.com','t.appsflyer.com',
  'branch.io','api2.branch.io',
  'adjust.com','app.adjust.com',
  'kochava.com','control.kochava.com',
  'mparticle.com','nativesdks.mparticle.com',
  'clevertap.com','wzrkt.com',
  'leanplum.com','api.leanplum.com',
  'kissmetrics.com','doug1izaerwt3.cloudfront.net',
  'woopra.com','www.woopra.com',
  'clicky.com','in.getclicky.com','static.getclicky.com',
  'matomo.cloud','cdn.matomo.cloud',
  'luckyorange.com','d10lpsik1i8c69.cloudfront.net',

  // Marketing Automation
  'marketo.com','mktoresp.com','mkt2527.com','js.marketo.munchkin.com',
  'munchkin.marketo.com',
  'pardot.com','go.pardot.com','pi.pardot.com',
  'eloqua.com','img.en25.com',
  'hubspot.com','track.hubspot.com','js.hubspotanalytics.com',
  'hs-analytics.net','hubspotanalytics.com',
  'intercom.io','api-iam.intercom.io','intercomcdn.com',
  'intercom.com','nexus-websocket-a.intercom.io',

  // Retargeting
  'adroll.com','d.adroll.com','s.adroll.com',
  'perfectaudience.com',
  'retargeter.com',
  'fetchback.com',

  // Live chat / support (often include tracking)
  'zopim.com','widget.zopim.com',
  'olark.com','static.olark.com',
  'livechatinc.com','cdn.livechatinc.com',

  // A/B Testing
  'conductrics.com',
  'diy.clicktale.net','cdnssl.clicktale.net',
  'abtasty.com','try.abtasty.com',

  // Data brokers / identity resolution
  'liveramp.com','rlcdn.com','launchpad.liveramp.com',
  'acxiom.com',
  'experian.com',
  'datalogix.com','trk.vindicosuite.com',
  'bluekai.com','tags.bluekai.com','oracle.com',
  'krxd.net','beacon.krxd.net',
  'exelator.com',
  'wunderloop.net',
  'turn.com','bd.turn.com','tpc.googlesyndication.com',
  'mediamath.com','t.mediamath.com',

  // CDNs primarily used for ads (careful with general CDNs)
  'ad.mo.pay','moatads.com','px.moat.com','sejs.moatads.com',

  // Misc trackers
  'isnssync.com','sync.1rx.io','sync.adkernel.com',
  'usermatch.krxd.net','match.rundsp.com',
  'capi.connatix.com','recv.connatix.com',
  'gemius.pl','hit.gemius.pl',
  'vizury.com','bzgint.com',
  'trafficfactory.biz',
  'propellerads.com','propellads.com',
  'zonos.com',
  'spotxchange.com','cdn.spotxchange.com',
  'springserve.com','serve.springserve.com',
  'bidswitch.net','x.bidswitch.net',
  'sharethrough.com','btlr.sharethrough.com',
  'triplelift.com','eb2.3lift.com',
  'yieldmo.com','ad.yieldmo.com',
  'districtm.io','prebid.districtm.io',
  'contextweb.com','bh.contextweb.com',
  'eyeota.net','cdn.eyeota.net',
  'emxdgt.com','cs.emxdgt.com',
  'smartclip.net','nz.smartclip.net',
  'between.digital',
  'rhythmone.com','serving.rhythmone.com',
  'teads.tv','a.teads.tv',
  'undertone.com','cdn.undertone.com',
  'yieldbot.com',
  'adsafeprotected.com','pixel.adsafeprotected.com',
  'integral-systems.com','pixel.integral-systems.com',
  'doubleverify.com',

  // Cookie consent (paradoxically track consent state + fingerprint)
  'cookiepro.com','optanon.blob.core.windows.net',
  'cdn.cookielaw.org',
  'consent.cookiebot.com','consentcdn.cookiebot.com',
])

export function isTrackerDomain(url: string): boolean {
  try {
    const hostname = new URL(url).hostname.toLowerCase()
    if (TRACKER_DOMAINS.has(hostname)) return true
    // Check parent domains (e.g., 'sub.tracker.com' → 'tracker.com')
    const parts = hostname.split('.')
    for (let i = 1; i < parts.length - 1; i++) {
      if (TRACKER_DOMAINS.has(parts.slice(i).join('.'))) return true
    }
    return false
  } catch {
    return false
  }
}

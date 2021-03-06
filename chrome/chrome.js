// Include sgpvp.js before this.

// DOM is ready now.
SGPvP.prototype.platformInit = function() {
    this.top.addEventListener('message', this.onMessage.bind(this), false);
};

SGPvP.prototype.onMessage = function(event) {
    var data = event.data;
    if(data && data.sgpvp == 2)
        this.onFrameReady(data.frame);
};

SGMain.prototype.getVersion = function() {
    return chrome.runtime.getManifest().version;
};

SGStorage.prototype.rawGet = function( keys, callback ) {
    chrome.storage.local.get( keys, callback );
}

SGStorage.prototype.rawSet = function( settings, callback ) {
    chrome.storage.local.set( settings, callback );
}

// The following are here because the Firefox implementations have to
// deal with oddities introduced by "Mr Xyzzy's Pardus Helper".
// There's no such thing on Chrome, so we can simplify here.

SGMain.prototype.BUILDING_PLAYER_DETAIL_RX = /^building\.php\?detail_type=player&detail_id=(\d+)/;
SGMain.prototype.getShipsBuilding = function() {
    var doc = this.doc,
    xpr = doc.evaluate("//table[@class='messagestyle']/tbody/tr/th",
                       doc, null, XPathResult.UNORDERED_NODE_ITERATOR_TYPE,
                       null);
    var th;
    while((th = xpr.iterateNext())) {
        var heading = th.textContent;
        if(heading == 'Other Ships')
            return this.parseOtherShipsTable(th.parentNode.parentNode,
                                             this.BUILDING_PLAYER_DETAIL_RX);
    }

    // Still here?
    return [];
};

// XXX - untested!!
SGMain.prototype.SHIP2SHIP_RX = /^ship2ship_combat\.php\?playerid=(\d+)/;
SGMain.prototype.getShipsCombat = function() {
    var doc = this.doc,
    xpr = doc.evaluate("//table[@class='messagestyle']/tbody/tr/th",
                       doc, null, XPathResult.UNORDERED_NODE_ITERATOR_TYPE,
                       null);
    var th;
    while((th = xpr.iterateNext())) {
        var heading = th.textContent;
        if(heading == 'Other Ships')
            return this.parseOtherShipsTable(th.parentNode.parentNode,
                                             this.SHIP2SHIP_RX);
    }

    // Still here?
    return [];
};

// This gets the faction and ship type from a ship entry. It's a
// separate method to reuse it - we do it the same in all pages.
SGMain.prototype.SHIPBGIMAGE_RX = /^url\("[^"]+\/ships\/([^/.]+)(?:_paint\d+|xmas)?\.png"\)$/;
SGMain.prototype.SHIPIMSRC_RX = /ships\/([^/.]+)(?:_paint\d+|xmas)?\.png$/;
SGMain.prototype.FACTIONSIGN_RX = /factions\/sign_(fed|emp|uni)/;
SGMain.prototype.getShipEntryExtras = function(entry) {
    // find the ship type
    var itd = entry.td.previousElementSibling;
    if(itd) {
        var m = this.SHIPBGIMAGE_RX.exec(itd.style.backgroundImage);
        if(m)
            entry.shipModel = m[1];

        // see if we find a faction
        var xpr = this.doc.evaluate("img", itd, null,
                                    XPathResult.UNORDERED_NODE_ITERATOR_TYPE,
                                    null);
        var img;
        while((img = xpr.iterateNext())) {
            var src = img.src;
            if((m = this.FACTIONSIGN_RX.exec(src)))
                entry.faction = m[1];
        }
    }

    if(!entry.faction)
        entry.faction = 'neu';
};


// Our versions of GM_getResourceURL and GM_getResourceText. We use
// these in Chrome to fetch resources included with the extension.

SGMain.prototype.RESOURCE = {
    ui_html: 'ui.html',
    ui_style: 'ui.css',
    default_keymap: 'default-keymap.json'
};

SGMain.prototype.getResourceURL = function(resource_id) {
    return chrome.extension.getURL(this.RESOURCE[resource_id]);
};

SGMain.prototype.getResourceText = function(resource_id, callback) {
    var rq = new XMLHttpRequest();
    rq.open('GET', this.getResourceURL(resource_id));
    rq.onreadystatechange = function() {
        if (rq.readyState == XMLHttpRequest.DONE)
            callback(rq.responseText);
    };
    rq.send();
};

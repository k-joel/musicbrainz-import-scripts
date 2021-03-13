// ==UserScript==
// @name         Testing-cdjapan-musicbrainz-import
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  try to take over the world!
// @author       You
// @match        https://www.cdjapan.co.jp/*
// @icon         https://www.google.com/s2/favicons?domain=tampermonkey.net
// @grant        none
// @require      https://cdnjs.cloudflare.com/ajax/libs/jquery/3.4.1/jquery.min.js
// @require      https://raw.githubusercontent.com/murdos/musicbrainz-userscripts/master/lib/mbimport.js
// @require      https://raw.githubusercontent.com/murdos/musicbrainz-userscripts/master/lib/mbimportstyle.js
// ==/UserScript==

// prevent JQuery conflicts, see http://wiki.greasespot.net/@grant
this.$ = this.jQuery = jQuery.noConflict(true);

$(document).ready(function () {
    MBImportStyle();
    console.log("test")
    $('#js-scroll-fix').append('<div id="mb_buttons">Button!</div>"');

    //$('#mb_buttons').slideDown()
});

function getReleaseInfo() {
    let release = {
        artist_credit: '',
        title: $("h1 span[itemprop='name']").text().trim(),
        year: 0,
        month: 0,
        day: 0,
        format: '',
        packaging: '',
        country: '',
        status: 'official',
        language: 'eng',
        script: 'Latn',
        type: '',
        urls: [],
        labels: [],
        discs: [],
    };

}
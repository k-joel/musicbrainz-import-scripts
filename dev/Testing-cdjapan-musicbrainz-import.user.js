// ==UserScript==
// @name         Testing-cdjapan-musicbrainz-import
// @namespace    https://github.com/k-joel/musicbrainz-import-scripts
// @version      0.1
// @description  Import CDJapan releases to MusicBrainz
// @author       k-joel
// @downloadURL  https://github.com/k-joel/musicbrainz-import-scripts/raw/main/cdjapan-musicbrainz-import.user.js
// @updateURL    https://github.com/k-joel/musicbrainz-import-scripts/raw/main/cdjapan-musicbrainz-import.user.js
// @match        http*://www.cdjapan.co.jp/product/*
// @icon         https://raw.githubusercontent.com/murdos/musicbrainz-userscripts/master/assets/images/Musicbrainz_import_logo.png
// @grant        none
// @require      https://code.jquery.com/jquery-3.6.0.min.js
// @require      https://raw.githubusercontent.com/murdos/musicbrainz-userscripts/master/lib/mbimport.js
// @require      https://raw.githubusercontent.com/murdos/musicbrainz-userscripts/master/lib/mblinks.js
// @require      https://raw.githubusercontent.com/murdos/musicbrainz-userscripts/master/lib/mbimportstyle.js
// @require      file://D:/Code/musicbrainz-import-scripts/dev/Testing-cdjapan-musicbrainz-import.user.js
// ==/UserScript==

//jshint esversion:6

if (window.top != window.self)  //-- Don't run on frames or iframes
    return;

// prevent JQuery conflicts, see http://wiki.greasespot.net/@grant
this.$ = this.jQuery = jQuery.noConflict(true);

$(document).ready(function () {
    MBImportStyle();
    let release_url = window.location.href.replace('/?.*$/', '').replace('/#.*$/', '');

    let release = makeReleaseInfo(release_url);
    let buttons = 
        makeImportButton(release, release_url) + 
        makeSearchButton(release);

    insertImportLinks(buttons);
});

let keys = {
    catNo: "Catalog No.",
    isbn: "JAN/ISBN",
    type: "Product Type",
    discs: "Number of Discs",
    label: "Label/Distributor",
};

const propKeys = [keys.catNo, keys.isbn, keys.type, keys.discs, keys.label];

function makeReleaseInfo(release_url) {
    let release = {
        artist_credit: '',
        title: '',
        type: '',
        year: 0,
        month: 0,
        day: 0,
        format: '',
        packaging: '',
        country: '',
        status: 'official',
        language: 'jpn', 
        script: 'Jpan',
        annotation: '',
        barcode: '',
        urls: [],
        labels: [],
        discs: [],
    };

    // Image url
    let imgUrl = "https:" + $("#prod-thumb img").attr("src");

    // Title
    let title = $("div.product_info h1 span[itemprop='name']").text().trim();
    release.title = title;

    // Artist
    let artist = $("div.product_info h3.person").text().trim();
    let various_artists = artist == 'V.A.';
    if (various_artists) {
        release.artist_credit = [MBImport.specialArtist('various_artists')];
    } else {
        release.artist_credit = MBImport.makeArtistCredits([artist]);
    }

    // Primary Type
    let media = $("div.product_info span.media").text().trim();
    if (media.match(/.*(Album|LP).*/)) {
        release.type = "Album";
    }
    else if (media.match(/.*EP.*/)) {
        release.type = "EP";
    }
    else {
        release.type = "Other";
    }

    // Release Date
    let release_date = $("table.basic-info span[itemprop='releaseDate']").text().trim();
    let date = new Date(release_date);    
    release.day = date.getDate();
    release.month = date.getMonth() + 1;
    release.year = date.getFullYear();

    // Get properties in table
    let props = {};
    $("table.prod-spec tbody tr").each(function(index, row) {
        let prop = row.cells.item(0).innerHTML.trim();
        if (propKeys.includes(prop)) {
            let value = row.cells.item(1).innerText.trim();
            props[prop] = value;
        }        
    });

    // Format
    let link_type = MBImport.URL_TYPES;
    let format = props[keys.type];
    if (format.match(/^vinyl/i)) {
        release.country = 'JP';
        release.format = 'Vinyl';
        release.urls.push({
            url: release_url,
            link_type: link_type.purchase_for_mail_order,
        });
    } else if (format.match(/^cd/i)) {
        release.country = 'JP';
        release.format = 'CD';
        release.urls.push({
            url: release_url,
            link_type: link_type.purchase_for_mail_order,
        });
    } else {
        release.country = 'XW';
        release.packaging = 'None';
        release.format = 'Digital Media';
        release.urls.push({
            url: release_url,
            link_type: link_type.purchase_for_download,
        });
    }

    // Barcode
    release.barcode = props[keys.isbn];

    // Label
    release.labels.push({
        name: props[keys.label],
        mbid: 0,
        catno: props[keys.catNo]
    });

    // Comment
    let descList = $("div.description");
    let description = descList.eq(descList.length-1).text().trim(); 
    release.annotation = description;

    // Tracks
    var tracks = [];
    $("table.tracklist tbody").children().each(function () {
        trackid = this.lastElementChild.firstElementChild.innerHTML;
        trackname = this.lastElementChild.lastElementChild.innerHTML;

        let track_artists = [artist];

        let ac = {
            artist_credit: '',
            title: trackname,
            duration: 0
        };
        if (!track_artists.length && various_artists) {
            ac.artist_credit = [MBImport.specialArtist('unknown')];
        } else {
            ac.artist_credit = MBImport.makeArtistCredits(track_artists);
        }

        tracks.push(ac);
    });

    release.discs.push({
        title: release.title,
        format: release.format,
        tracks: tracks,
    });

    return release;
}

function makeImportButton(release, release_url) {
    let edit_note = MBImport.makeEditNote(release_url, "CD Japan", "", "https://github.com/k-joel/musicbrainz-import-scripts");
    let parameters = MBImport.buildFormParameters(release, edit_note);
    return MBImport.buildFormHTML(parameters);
}

function makeSearchButton(release) {
    return MBImport.buildSearchButton(release);
}

function insertImportLinks(buttons) {
    $("div.buttons").append($(`<div id="mb_buttons" class="sub-buttons">${buttons}</div>`));
}
// ==UserScript==
// @name         Import CDJapan releases to MusicBrainz
// @namespace    https://github.com/k-joel/musicbrainz-import-scripts
// @version      0.1
// @description  Adds a button to CDJapan's product page to import that release into MusicBrainz
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
// ==/UserScript==

//jshint esversion:6

if (window.top != window.self)  //-- Don't run on frames or iframes
    return;

// prevent JQuery conflicts, see http://wiki.greasespot.net/@grant
this.$ = this.jQuery = jQuery.noConflict(true);

$(document).ready(function () {
    MBImportStyle();
    let releaseUrl = window.location.href.replace('/?.*$/', '').replace('/#.*$/', '');

    let release = makeReleaseInfo(releaseUrl);
    let buttons = 
        makeImportButton(release, releaseUrl) + 
        makeSearchButton(release);

    insertImportLinks(buttons);
});

function makeReleaseInfo(releaseUrl) {
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

    // Release Date
    let releaseDate = $("table.basic-info span[itemprop='releaseDate']").text().trim();
    let date = new Date(releaseDate);    
    release.day = date.getDate();
    release.month = date.getMonth() + 1;
    release.year = date.getFullYear();

    // Get properties in table
    const tableKeys = {
        catNo: "Catalog No.",
        isbn: "JAN/ISBN",
        type: "Product Type",
        discs: "Number of Discs",
        label: "Label/Distributor",
    };

    const propKeys = Object.values(tableKeys);
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
    let format = props[tableKeys.type];
    if (format.match(/^vinyl/i)) {
        release.country = 'JP';
        release.format = 'Vinyl';
        release.urls.push({
            url: releaseUrl,
            link_type: link_type.purchase_for_mail_order,
        });
    } else if (format.match(/^cd/i)) {
        release.country = 'JP';
        release.format = 'CD';
        release.urls.push({
            url: releaseUrl,
            link_type: link_type.purchase_for_mail_order,
        });
    } else {
        release.country = 'XW';
        release.packaging = 'None';
        release.format = 'Digital Media';
        release.urls.push({
            url: releaseUrl,
            link_type: link_type.purchase_for_download,
        });
    }

    // Primary Type
    if (format.match(/(cd|lp)/i)) {
        release.type = "Album";
    }
    else if (format.match(/ep/i)) {
        release.type = "EP";
    }
    else {
        release.type = "Other";
    }

    // Barcode
    release.barcode = props[tableKeys.isbn];

    // Label
    release.labels.push({
        name: props[tableKeys.label],
        mbid: 0,
        catno: props[tableKeys.catNo]
    });

    // Comment
    let descList = $("div.description");
    let description = descList.eq(descList.length-1).text().trim(); 
    release.annotation = description;

    // Tracks
    var tracks = [];
    $("table.tracklist tbody").children().each(function () {
        titleChildren = this.lastElementChild.children;
        trackname = titleChildren[0].innerHTML.trim();
        if (trackname == '') {
            trackname = titleChildren[1].innerHTML.trim();
        }


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

function makeImportButton(release, releaseUrl) {
    let editNote = MBImport.makeEditNote(releaseUrl, "CD Japan", "", "https://github.com/k-joel/musicbrainz-import-scripts");
    let parameters = MBImport.buildFormParameters(release, editNote);
    return MBImport.buildFormHTML(parameters);
}

function makeSearchButton(release) {
    return MBImport.buildSearchButton(release);
}

function insertImportLinks(buttons) {
    $("div.buttons").append($(`<div id="mb_buttons" class="sub-buttons">${buttons}</div>`));
}
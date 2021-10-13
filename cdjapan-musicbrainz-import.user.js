// ==UserScript==
// @name         cdjapan-musicbrainz-import
// @namespace    https://github.com/k-joel/musicbrainz-import-scripts
// @version      0.1
// @description  Import CDJapan releases to MusicBrainz
// @author       k-joel
// @downloadURL  https://github.com/k-joel/musicbrainz-import-scripts/raw/main/cdjapan-musicbrainz-import.user.js
// @updateURL    https://github.com/k-joel/musicbrainz-import-scripts/raw/main/cdjapan-musicbrainz-import.user.js
// @match        http*://www.cdjapan.co.jp/product/*
// @icon         https://www.google.com/s2/favicons?domain=tampermonkey.net
// @icon         https://raw.githubusercontent.com/murdos/musicbrainz-userscripts/master/assets/images/Musicbrainz_import_logo.png
// @grant        none
// @require      https://code.jquery.com/jquery-3.6.0.min.js
// @require      https://raw.githubusercontent.com/murdos/musicbrainz-userscripts/master/lib/mbimport.js
// @require      https://raw.githubusercontent.com/murdos/musicbrainz-userscripts/master/lib/mblinks.js
// @require      https://raw.githubusercontent.com/murdos/musicbrainz-userscripts/master/lib/mbimportstyle.js
// ==/UserScript==

if (window.top != window.self)  //-- Don't run on frames or iframes
    return;

// prevent JQuery conflicts, see http://wiki.greasespot.net/@grant
this.$ = this.jQuery = jQuery.noConflict(true);

$(document).ready(function () {
    MBImportStyle();
    let release_url = window.location.href.replace('/?.*$/', '').replace('/#.*$/', '');

    let release = makeReleaseInfo(release_url);
    let buttons = makeImportButton(release, release_url);

    insertImportLinks(buttons);
});

function makeReleaseInfo(release_url) {
    let release = {
        artist_credit: '',
        title: '',
        year: 0,
        month: 0,
        day: 0,
        format: '',
        packaging: '',
        country: '',
        status: 'official',
        language: 'jpn', // multiple languages
        script: 'Jpan', // multiple scripts
        type: '',
        annotation: '',
        barcode: '',
        urls: [],
        labels: [],
        discs: [],
    };

    // Title
    let title = $("div.product_info h1 span[itemprop='name']").text().trim();
    release.title = title;

    // Artist
    let artist = $("div.product_info h3.person").text().trim(); // check for various
    let various_artists = artist == 'Various';
    if (various_artists) {
        release.artist_credit = [MBImport.specialArtist('various_artists')];
    } else {
        release.artist_credit = MBImport.makeArtistCredits([artist]);
    }

    // Release Date
    let release_date = $("table.basic-info span[itemprop='releaseDate']").text().trim();
    let date = new Date(release_date);    
    release.day = date.getDate();
    release.month = date.getMonth() + 1;
    release.year = date.getFullYear();

    // Format
    let link_type = MBImport.URL_TYPES;
    let format = $("table.prod-spec tbody tr:nth-child(3) td").text().trim();
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
    } else if (format.match(/^download/i)) {
        release.country = 'XW';
        release.packaging = 'None';
        release.format = 'Digital Media';
        release.urls.push({
            url: release_url,
            link_type: link_type.purchase_for_download,
        });
    }

    // Barcode
    let isbn = $("table.prod-spec tbody tr:nth-child(2) td").text().trim();
    release.barcode = isbn;

    // Label
    let catalog_no = $("table.prod-spec tbody tr:nth-child(1) td").text().trim();
    let label = $("table.prod-spec tbody tr:nth-child(5) td").text().trim();
    release.labels.push({
        name: label,
        mbid: 0,
        catno: catalog_no
    });

    // Comment
    let description = $("div.description").html().trim(); // use html here since the text also includes the original japanese description
    release.annotation = description;

    //let num_discs = $("table.prod-spec tbody tr:nth-child(4) td").text().trim(); // todo

    // Tracks
    var tracks = []
    $("table.tracklist tbody").children().each(function (i) {
        trackid = this.lastElementChild.firstElementChild.innerHTML;
        trackname = this.lastElementChild.lastElementChild.innerHTML;

        // todo various artists
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
        title: title,
        format: format,
        tracks: tracks,
    });

    return release;
}

function makeImportButton(release, release_url) {
    let edit_note = MBImport.makeEditNote(release_url, "CD Japan", "", "https://github.com/k-joel/musicbrainz-import-scripts");
    let parameters = MBImport.buildFormParameters(release, edit_note);
    return MBImport.buildFormHTML(parameters)
}

function insertImportLinks(buttons) {
    $("div.buttons").append($(`<div id="mb_buttons" class="sub-buttons">${buttons}</div>`));
}
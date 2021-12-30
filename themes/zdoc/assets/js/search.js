"use strict";

window.onload = function() {
    var searchResults = null;
    var searchMenu = null;
    var searchText = null;
    var fuse = null;

    (function initFuse() {
        var xhr = new XMLHttpRequest();
        xhr.open('GET', baseurl + langprefix + "/index.json");
        xhr.setRequestHeader('Content-Type', 'application/json; charset=utf-8');
        xhr.onload = function () {
            if (xhr.status === 200) {
                fuse = new Fuse(JSON.parse(xhr.response.toString('utf-8')), {
                    keys: ['title', 'description', 'content'],
                    includeMatches: enableSearchHighlight,
                    shouldSort: true,
                    threshold: 0.4,
                    location: 0,
                    distance: 100,
                    maxPatternLength: 32,
                    minMatchCharLength: 1,
                });
            }
            else {
                console.error(`[${xhr.status}]Error:`, xhr.statusText);
            }
        };
        xhr.send();
    })();

    function renderSearchResults(searchText, results) {
        searchResults = document.getElementById('search-results');
        searchMenu = document.getElementById('search-menu');
        searchResults.setAttribute('class', 'dd is-active');

        var ul = document.createElement('ul');
        ul.setAttribute('class', 'dd-content search-content');

        if (results.length) {
            results.forEach(function (result) {
                var li = document.createElement('li');
                var a = document.createElement('a');
                a.setAttribute('href', result.uri);
                a.setAttribute('class', 'dd-item');
                a.appendChild(li);

                var titleDiv = document.createElement('div');
                titleDiv.innerHTML = result.title;
                titleDiv.setAttribute('class', 'search-result__item--title');

                var descDiv = document.createElement('div');
                descDiv.setAttribute('class', 'search-result__item--desc');
                if (result.description) {
                    descDiv.innerHTML = result.description;
                } else if (result.content) {
                    descDiv.innerHTML = result.content.substring(0, 80);
                }

                li.appendChild(titleDiv);
                li.appendChild(descDiv);
                ul.appendChild(a);
            });
        } else {
            var li = document.createElement('li');
            li.setAttribute('class', 'dd-item');
            li.innerText = 'No results found';
            ul.appendChild(li);
        }

        while (searchMenu.hasChildNodes()) {
            searchMenu.removeChild(
                searchMenu.lastChild
            );
        }

        searchMenu.appendChild(ul);
    }

    function renderSearchHighlightResults(searchText, results) {
        searchResults = document.getElementById('search-results');
        searchMenu = document.getElementById('search-menu');
        searchResults.setAttribute('class', 'dd is-active');

        var ul = document.createElement('ul');
        ul.setAttribute('class', 'dd-content search-content');

        if (results.length) {
            results.forEach(function (result) {
                var li = document.createElement('li');
                var a = document.createElement('a');
                var descDiv = null;

                a.setAttribute('href', result.item.uri);
                a.setAttribute('class', 'dd-item');
                a.appendChild(li);

                var titleDiv = document.createElement('div');
                titleDiv.innerHTML = result.item.title;
                titleDiv.setAttribute('class', 'search-result__item--title');

                if (result.matches && result.matches.length) {
                    for (var i = 0; i < result.matches.length; i++) {
                        if ('title' === result.matches[i].key) {
                            titleDiv.innerHTML = generateHighlightedText(result.matches[i].value, result.matches[i].indices);
                        }

                        if ('description' === result.matches[i].key) {
                            descDiv = document.createElement('div');
                            descDiv.setAttribute('class', 'search-result__item--desc');
                            descDiv.innerHTML = generateHighlightedText(result.item.description, result.matches[i].indices);
                        } else if ('content' === result.matches[i].key) {
                            if (!descDiv) {
                                descDiv = document.createElement('div');
                                descDiv.setAttribute('class', 'search-result__item--desc');
                                descDiv.innerHTML = generateHighlightedText(result.item.content.substring(0, 80), result.matches[i].indices);
                            }
                        } else {
                            if (result.item.description) {
                                descDiv = document.createElement('div');
                                descDiv.setAttribute('class', 'search-result__item--desc');
                                descDiv.innerHTML = result.item.description;
                            } else {
                                descDiv = document.createElement('div');
                                descDiv.setAttribute('class', 'search-result__item--desc');
                                descDiv.innerHTML = result.item.content.substring(0, 80);
                            }
                        }
                    }

                    li.appendChild(titleDiv);
                    if (descDiv) {
                        li.appendChild(descDiv);
                    }
                    ul.appendChild(a);
                }
            });
        } else {
            var li = document.createElement('li');
            li.setAttribute('class', 'dd-item');
            li.innerText = 'No results found';
            ul.appendChild(li);
        }

        while (searchMenu.hasChildNodes()) {
            searchMenu.removeChild(
                searchMenu.lastChild
            );
        }
        searchMenu.appendChild(ul);
    }

    function renderSearchResultsMobile(searchText, results) {
        searchResults = document.getElementById('search-mobile-results');

        var content = document.createElement('div');
        content.setAttribute('class', 'mobile-search__content');

        if (results.length > 0) {
            results.forEach(function (result) {
                var item = document.createElement('a');
                item.setAttribute('href', result.uri);
                item.innerHTML = '<div class="mobile-search__item"><div class="mobile-search__item--title">📄 ' + result.title + '</div><div class="mobile-search__item--desc">' + (result.description ? result.description : result.content) + '</div></div>';
                content.appendChild(item);
            });
        } else {
            var item = document.createElement('span');
            content.appendChild(item);
        }

        let wrap = document.getElementById('search-mobile-results');
        while (wrap.firstChild) {
            wrap.removeChild(wrap.firstChild)
        }
        searchResults.appendChild(content);
    }

    function renderSearchHighlightResultsMobile(searchText, results) {
        searchResults = document.getElementById('search-mobile-results');

        var ul = document.createElement('div');
        ul.setAttribute('class', 'mobile-search__content');

        if (results.length) {
            results.forEach(function (result) {
                var li = document.createElement('li');
                var a = document.createElement('a');
                var descDiv = null;

                a.setAttribute('href', result.item.uri);
                a.appendChild(li);
                li.setAttribute('class', 'mobile-search__item');

                var titleDiv = document.createElement('div');
                titleDiv.innerHTML = result.item.title;
                titleDiv.setAttribute('class', 'mobile-search__item--title');

                if (result.matches && result.matches.length) {
                    for (var i = 0; i < result.matches.length; i++) {
                        if ('title' === result.matches[i].key) {
                            titleDiv.innerHTML = generateHighlightedText(result.matches[i].value, result.matches[i].indices);
                        }

                        if ('description' === result.matches[i].key) {
                            descDiv = document.createElement('div');
                            descDiv.setAttribute('class', 'mobile-search__item--desc');
                            descDiv.innerHTML = generateHighlightedText(result.item.description, result.matches[i].indices);
                        } else if ('content' === result.matches[i].key) {
                            if (!descDiv) {
                                descDiv = document.createElement('div');
                                descDiv.setAttribute('class', 'mobile-search__item--desc');
                                descDiv.innerHTML = generateHighlightedText(result.item.content.substring(0, 150), result.matches[i].indices);
                            }
                        } else {
                            if (result.item.description) {
                                descDiv = document.createElement('div');
                                descDiv.setAttribute('class', 'mobile-search__item--desc');
                                descDiv.innerHTML = result.item.description;
                            } else {
                                descDiv = document.createElement('div');
                                descDiv.setAttribute('class', 'mobile-search__item--desc');
                                descDiv.innerHTML = result.item.content.substring(0, 150);
                            }
                        }
                    }

                    li.appendChild(titleDiv);
                    if (descDiv) {
                        li.appendChild(descDiv);
                    }
                    ul.appendChild(a);
                }
            });
        } else {
            var item = document.createElement('span');
            ul.appendChild(item);
        }

        let wrap = document.getElementById('search-mobile-results');
        while (wrap.firstChild) {
            wrap.removeChild(wrap.firstChild)
        }
        searchResults.appendChild(ul);
    }

    function generateHighlightedText(text, regions) {
        if (!regions) {
            return text;
        }

        var content = '', nextUnhighlightedRegionStartingIndex = 0;

        regions.forEach(function(region) {
            if (region[0] === region[1]) {
                return null;
            }

            content += '' +
                text.substring(nextUnhighlightedRegionStartingIndex, region[0]) +
                '<span class="search__highlight">' +
                text.substring(region[0], region[1] + 1) +
                '</span>' +
                '';
            nextUnhighlightedRegionStartingIndex = region[1] + 1;
        });

        content += text.substring(nextUnhighlightedRegionStartingIndex);

        return content;
    };

    var searchElem = document.getElementById('search');
    var searchResultsContainer = document.getElementById('search-results');

    searchElem ?
        searchElem.addEventListener('input', function(e) {
            searchText = e.target.value;
            var results = fuse.search(e.target.value);

            if (enableSearchHighlight) {
                renderSearchHighlightResults(searchText, results);
            } else {
                renderSearchResults(searchText, results);
            }

            var dropdownItems = searchResultsContainer.querySelectorAll('.dd-item');
            dropdownItems ? dropdownItems.forEach(function (item) {
                item.addEventListener('mousedown', function (e) {
                    e.target.click();
                });
            }) : null;
        }) : null;

    searchElem ?
        searchElem.addEventListener('blur', function() {
            searchResultsContainer ? searchResultsContainer.setAttribute('class', 'dd') : null;
        }) : null;

    searchElem ?
        searchElem.addEventListener('click', function(e) {
            if (!e.target.value) {
                searchResultsContainer ? searchResultsContainer.setAttribute('class', 'dd') : null;
                return null;
            }

            searchText = e.target.value;
            var results = fuse.search(e.target.value);

            if (enableSearchHighlight) {
                renderSearchHighlightResults(searchText, results);
            } else {
                renderSearchResults(searchText, results);
            }

            var dropdownItems = searchResultsContainer.querySelectorAll('.dd-item');
            dropdownItems ? dropdownItems.forEach(function (item) {
                item.addEventListener('mousedown', function (e) {
                    e.target.click();
                });
            }) : null;
        }) : null;

    var searchMenuElem = document.getElementById("search-menu");
    var activeItem = document.querySelector('#search-menu .dd-item.is-active');
    var activeIndex = null;
    var items = null;
    var searchContainerMaxHeight = 350;

    searchElem ?
        searchElem.addEventListener('keydown', function(e) {
            var items = document.querySelectorAll('#search-menu .dd-item');

            if (e.key === 'ArrowDown') {
                if (activeIndex === null) {
                    activeIndex = 0;
                    items[activeIndex].classList.remove('is-active');
                } else {
                    items[activeIndex].classList.remove('is-active');
                    activeIndex = activeIndex === items.length - 1 ? 0 : activeIndex + 1;
                }
                items[activeIndex].classList.add('is-active');

                let overflowedPixel = items[activeIndex].offsetTop + items[activeIndex].clientHeight - searchContainerMaxHeight;
                if (overflowedPixel > 0) {
                    document.querySelector(".search-content").scrollTop += items[activeIndex].getBoundingClientRect().height;
                } else if (activeIndex === 0) {
                    document.querySelector(".search-content").scrollTop = 0;
                }
            } else if (e.key === 'ArrowUp') {
                if (activeIndex === null) {
                    activeIndex = items.length - 1;
                    items[activeIndex].classList.remove('is-active');
                } else {
                    items[activeIndex].classList.remove('is-active');
                    activeIndex = activeIndex === 0 ? items.length - 1 : activeIndex - 1;
                }
                items[activeIndex].classList.add('is-active');

                let overflowedPixel = items[activeIndex].offsetTop + items[activeIndex].clientHeight - searchContainerMaxHeight;
                if (overflowedPixel < 0) {
                    document.querySelector(".search-content").scrollTop -= items[activeIndex].getBoundingClientRect().height;
                } else {
                    document.querySelector(".search-content").scrollTop = overflowedPixel + items[activeIndex].getBoundingClientRect().height;
                }
            } else if (e.key === 'Enter') {
                var currentItemLink = items[activeIndex].getAttribute('href');
                if (currentItemLink) {
                    location.href = currentItemLink;
                }
            } else if (e.key === 'Escape') {
                e.target.value = null;
                if (searchResults) {
                    searchResults.classList.remove('is-active');
                }
            }
        }) : null;
}
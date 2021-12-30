"use strict";

var App = function () {
    //
    // Setup module components
    //

    var _initLayout = function() {
        // ==================== toc visibility ========================
        var toggleSidebarElem = document.getElementById("toggle-sidebar");
        var toggleMenuElem = document.getElementById("toggle-menu");
        var tocBodyElem = document.querySelector('.toc__body');
        var tocLabelElem = document.querySelector('.toc__label');
        var listMainElem = document.getElementById('list-main');
        var listSideElem = document.getElementById('list-side');
        var singleMenuElem = document.getElementById('single-menu');
        var sliderIcons = document.querySelectorAll('.slider__icon');

        toggleSidebarElem ?
            toggleSidebarElem.addEventListener('change', function (e) {
                if (e.target.checked) {
                    if (tocBodyElem) {
                        fadeIn(tocBodyElem, 200);
                    }
                    if (tocLabelElem) {
                        fadeIn(tocLabelElem, 200);
                    }
                    if (listMainElem && listSideElem) {
                        listMainElem.className = 'm';
                        listSideElem.className = 'r';
                    }

                    sliderIcons && sliderIcons.forEach(function (elem) {
                        if (elem.classList.contains('hide')) {
                            elem.classList.remove('hide');
                        } else {
                            elem.classList.add('hide');
                        }
                    });

                } else {
                    if (tocBodyElem) {
                        fadeOut(tocBodyElem, 200);
                    }
                    if (tocLabelElem) {
                        fadeOut(tocLabelElem, 200);
                    }
                    if (listMainElem && listSideElem) {
                        listMainElem.className = 'mr';
                        listSideElem.className = 'hide';
                    }

                    sliderIcons && sliderIcons.forEach(function (elem) {
                        if (elem.classList.contains('hide')) {
                            elem.classList.remove('hide');
                        } else {
                            elem.classList.add('hide');
                        }
                    });
                }
            }) : null;

        toggleMenuElem ?
            toggleMenuElem.addEventListener('change', function (e) {
                if (e.target.checked) {
                    if (listMainElem && singleMenuElem) {
                        listMainElem.className = 'm';
                        singleMenuElem.className = 'l';
                    }

                    sliderIcons && sliderIcons.forEach(function (elem) {
                        if (elem.classList.contains('hide')) {
                            elem.classList.remove('hide');
                        } else {
                            elem.classList.add('hide');
                        }
                    });

                } else {
                    if (listMainElem && singleMenuElem) {
                        listMainElem.className = 'lm';
                        singleMenuElem.className = 'hide';
                    }

                    sliderIcons && sliderIcons.forEach(function (elem) {
                        if (elem.classList.contains('hide')) {
                            elem.classList.remove('hide');
                        } else {
                            elem.classList.add('hide');
                        }
                    });
                }
            }) : null;
        // ============================================================


        // ===================== navbar collapse ======================
        var navCollapseBtn = document.getElementById('navCollapseBtn');
        navCollapseBtn ? navCollapseBtn.addEventListener('click', function(e) {
            var navCollapse = document.querySelector('.navbar__collapse');

            if (navCollapse) {
                var dataOpen = navCollapse.getAttribute('data-open');

                if (dataOpen === 'true') {
                    navCollapse.setAttribute('data-open', 'false');
                    navCollapse.style.maxHeight = 0;
                } else {
                    navCollapse.setAttribute('data-open', 'true');
                    navCollapse.style.maxHeight = navCollapse.scrollHeight + "px";
                }
            }
        }) : null;
        // ============================================================


        // ========================== expand ==========================
        var expandBtn = document.querySelectorAll('.expand__button');

        for (let i = 0; i < expandBtn.length; i++) {
            expandBtn[i].addEventListener("click", function () {
                var content = this.nextElementSibling;
                if (content.style.maxHeight) {
                    content.style.maxHeight = null;
                    this.querySelector('svg').classList.add('expand-icon__right');
                    this.querySelector('svg').classList.remove('expand-icon__down');
                } else {
                    content.style.maxHeight = content.scrollHeight + "px";
                    this.querySelector('svg').classList.remove('expand-icon__right');
                    this.querySelector('svg').classList.add('expand-icon__down');
                }
            });
        }
        // ============================================================



        // ============================ tab ============================
        document.querySelectorAll('.tab') ?
            document.querySelectorAll('.tab').forEach(function(elem, idx) {
                var containerId = elem.getAttribute('id');
                var containerElem = elem;
                var tabLinks = elem.querySelectorAll('.tab__link');
                var tabContents = elem.querySelectorAll('.tab__content');
                var ids = [];

                tabLinks && tabLinks.length > 0 ?
                    tabLinks.forEach(function(link, index, self) {
                        link.onclick = function(e) {
                            for (var i = 0; i < self.length; i++) {
                                if (index === parseInt(i, 10)) {
                                    if (!self[i].classList.contains('active')) {
                                        self[i].classList.add('active');
                                        tabContents[i].style.display = 'block';
                                    }
                                } else {
                                    self[i].classList.remove('active');
                                    tabContents[i].style.display = 'none';
                                }
                            }
                        }
                    }) : null;
            }) : null;
        // =============================================================


        // ========================== codetab ==========================
        document.querySelectorAll('.codetab') ?
            document.querySelectorAll('.codetab').forEach(function(elem, idx) {
                var containerId = elem.getAttribute('id');
                var containerElem = elem;
                var codetabLinks = elem.querySelectorAll('.codetab__link');
                var codetabContents = elem.querySelectorAll('.codetab__content');
                var ids = [];

                for (var i = 0; i < codetabContents.length; i++) {
                    ids = ids.concat(codetabContents[i].getAttribute('id'));
                    codetabContents[i].style.display = 'none';

                    if (0 === parseInt(i, 10) && !codetabContents[i].classList.contains('active')) {
                        codetabContents[i].classList.add('active');
                    }
                }

                for (var i = 0; i < codetabLinks.length; i++) {
                    codetabLinks[i].setAttribute('id', ids[i]);

                    if (0 === parseInt(i, 10) && !codetabLinks[i].classList.contains('active')) {
                        codetabLinks[i].classList.add('active');
                    } else {
                        codetabLinks[i].classList.remove('active');
                    }
                }

                if (codetabContents.length > 0) {
                    codetabContents[0].style.display = 'block';
                }

                codetabLinks && codetabLinks.length > 0 ?
                    codetabLinks.forEach(function(link, index, self) {
                        link.onclick = function(e) {
                            for (var i = 0; i < self.length; i++) {
                                if (index === parseInt(i, 10)) {
                                    if (!self[i].classList.contains('active')) {
                                        self[i].classList.add('active');
                                        codetabContents[i].style.display = 'block';
                                    }
                                } else {
                                    self[i].classList.remove('active');
                                    codetabContents[i].style.display = 'none';
                                }
                            }
                        }
                    }) : null;
            }) : null;
        // =============================================================


        // ======================= toggle theme =======================
        var root = document.getElementById('root');
        var toggleToLightBtn = document.getElementById('toggleToLight');
        var toggleToDarkBtn = document.getElementById('toggleToDark');

        if (!enableDarkMode) {
            root.className = 'theme__light';
            localStorage.setItem('theme', 'light');
        }

        if (toggleToDarkBtn) {
            toggleToDarkBtn.onclick = function (e) {
                root.className = 'theme__dark';
                localStorage.setItem('theme', 'dark');
                toggleToLightBtn.className = 'navbar__icons--icon';
                toggleToDarkBtn.className = 'hide';
            }
        }

        if (toggleToLightBtn) {
            toggleToLightBtn.onclick = function (e) {
                root.className = 'theme__light';
                localStorage.setItem('theme', 'light');
                toggleToLightBtn.className = 'hide';
                toggleToDarkBtn.className = 'navbar__icons--icon';
            }
        }

        // =================== section menu collapse ==================
        document.querySelectorAll('.menu__list').forEach(function(elem) {
            if (elem.classList.contains('active')) {
                elem.style.maxHeight = elem.scrollHeight + "px";
            }
        });

        document.querySelectorAll('.menu__title--collapse').forEach(function(elem) {
            elem.addEventListener('click', function (e) {
                var content = this.nextElementSibling;
                var menuTitleIcon = this.querySelector('.menu__title--icon');
                if (!content) {
                    return null;
                }

                var parent = elem.parentNode;
                while (parent.classList.contains('menu__list') && parent.classList.contains('active')) {
                    parent.style.maxHeight = 100 * parent.children.length + "px";
                    parent = parent.parentNode;
                }

                if (content.style.maxHeight) {
                    content.style.maxHeight = null;
                    content.classList.remove('active');
                    menuTitleIcon.classList.remove('up');
                    menuTitleIcon.classList.add('down');

                } else {
                    content.style.maxHeight = content.scrollHeight + "px";
                    content.classList.add('active');

                    menuTitleIcon.classList.remove('down');
                    menuTitleIcon.classList.add('up');
                }
            });
        });
        // ============================================================


        // ========================== drawer ==========================
        var drawerOpenBtn = document.getElementById('drawer-btn');
        var modal = document.getElementById("myModal");
        var drawer = document.getElementById('myDrawer');
        var drawerCloseBtn = document.querySelector('.drawer__close');

        var openDrawer = function() {
            modal.style.opacity = 1;

            if (languagedir === 'rtl') {
                modal.style.right = 0;
                drawer.style.right = 0;
            } else {
                modal.style.left = 0;
                drawer.style.left = 0;
            }
        }

        var closeDrawer = function() {
            drawerOpenBtn.checked = false;
            modal.style.opacity = 0;

            if (languagedir === 'rtl') {
                drawer.style.right = '-100%';
            } else {
                drawer.style.left = '-100%';
            }


            setTimeout(function () {
                if (languagedir === 'rtl') {
                    modal.style.right = '-100%';
                } else {
                    modal.style.left = '-100%';
                }
            }, 250);
        }

        drawerOpenBtn.onchange = function () {
            if (drawerOpenBtn.checked){
                openDrawer();
            }
            else{
                closeDrawer();
            }

        }

        modal.onclick = function () {
            closeDrawer();
        }

        drawerCloseBtn.onclick = function () {
            closeDrawer();
        }
        // ==============================================================


        // =========================== scroll ===========================
        var lastScrollTop = window.pageYOffset || document.documentElement.scrollTop;
        var tocElem = document.querySelector('.toc');
        var tableOfContentsElem = tocElem ? tocElem.querySelector('#TableOfContents') : null;
        var singleContentsElem = document.querySelector('.single__contents');
        var dataBGImgs = document.querySelectorAll('div[data-bgimg]');


        if (tableOfContentsElem) {
            var tocHtml = tableOfContentsElem.innerHTML;
            var regex = /<\/a><a[^>]*[\>]/g;
            tocHtml = tocHtml.replaceAll(regex, "");
            tocHtml = tocHtml.replaceAll("<code>", "");
            tocHtml = tocHtml.replaceAll("</code>", "");
            tableOfContentsElem.innerHTML = tocHtml;

            if (tocHtml === '') {
                document.getElementsByClassName('toc')[0].classList.add('hide');
            }

            let links = tableOfContentsElem.querySelectorAll('a');

            for (var index = 0; index < links.length; index++) {
                links[index].addEventListener('click', function (event) {
                    const targetId = event.currentTarget.getAttribute('href').split('#')[1];
                    const targetElement = document.getElementById(targetId);
                    if (targetElement) {
                        event.preventDefault();
                        window.scroll({
                            top: targetElement.offsetTop + 150,
                            left: 0,
                            behavior: 'smooth'
                        });
                    }
                });
            }
        }

        if (tocLevels) {
            tocLevels = tocLevels.toString();
        } else {
            tocLevels = "h1, h2, h3, h4, h5, h6";
        }

        function setNavbarBG(scrollTop) {
            if (isHome && isLandingBgImg && Object.keys(isLandingBgImg).length) {
                if (isLandingBgImg.height <= scrollTop) {
                    dataBGImgs.forEach(function(elem) {
                        elem.setAttribute('data-bgimg', 'false');
                    });
                } else {
                    dataBGImgs.forEach(function (elem) {
                        elem.setAttribute('data-bgimg', 'true');
                    });
                }
            }
        }
        setNavbarBG(lastScrollTop);

        window.onscroll = function () {
            var st = window.pageYOffset || document.documentElement.scrollTop;
            if (st > lastScrollTop) { // scroll down
                singleContentsElem ?
                    singleContentsElem.querySelectorAll(tocLevels.toString()).forEach(function(elem) {
                        if (document.documentElement.scrollTop >= elem.offsetTop) {
                            if (tableOfContentsElem) {
                                var id = elem.getAttribute('id');
                                tocElem.querySelectorAll('a').forEach(function (elem) {
                                    elem.classList.remove('active');
                                });
                                tocElem.querySelector('a[href="#' + id + '"]') ?
                                    tocElem.querySelector('a[href="#' + id + '"]').classList.add('active') : null;
                            }
                        }
                    }) : null;
                setNavbarBG(st);
            } else { // scroll up
                singleContentsElem ?
                    singleContentsElem.querySelectorAll(tocLevels.toString()).forEach(function(elem) {
                        if (document.documentElement.scrollTop >= elem.offsetTop) {
                            if (tableOfContentsElem) {
                                var id = elem.getAttribute('id');
                                tocElem.querySelectorAll('a').forEach(function (elem) {
                                    elem.classList.remove('active');
                                });
                                tocElem.querySelector('a[href="#' + id + '"]') ?
                                    tocElem.querySelector('a[href="#' + id + '"]').classList.add('active') : null;
                            }
                        }
                    }) : null;
                setNavbarBG(st);
            }
            lastScrollTop = st <= 0 ? 0 : st;
        };


        // ============================================================



        // ====================== mobile search =======================
        var searchInputElem =  document.querySelector('#search');
        var mobileSearchBtnElem = document.querySelector('#mobileSearchBtn');
        var mobileSearchCloseBtnElem = document.querySelector('#search-mobile-close');
        var searchContainer = document.querySelector('#search-container');

        var htmlElem = document.querySelector('html');


        mobileSearchBtnElem ?
            mobileSearchBtnElem.addEventListener('click', function () {
                if (searchContainer) {
                    searchContainer.classList.add('show');
                }

                if (mobileSearchCloseBtnElem) {
                    mobileSearchCloseBtnElem.classList.remove('hide');
                }

                if (searchInputElem) {
                    searchInputElem.focus();
                }

                if (htmlElem) {
                    htmlElem.style.overflowY = 'hidden';
                }
            }) : null;

        mobileSearchCloseBtnElem ?
            mobileSearchCloseBtnElem.addEventListener('click', function() {
                if (searchContainer) {
                    searchContainer.classList.remove('show');
                }

                if (mobileSearchCloseBtnElem) {
                    mobileSearchCloseBtnElem.classList.add('hide');
                }

                if (searchInputElem) {
                    searchInputElem.value = '';
                }

                if (htmlElem) {
                    htmlElem.style.overflowY = 'visible';
                }
            }) : null;

        // ============================================================


        // ======================= theme change =======================
        var localTheme = localStorage.getItem('theme');
        var rootEleme = document.getElementById('root');
        var selectThemeElem = document.querySelectorAll('.select-theme');
        var selectThemeItemElem = document.querySelectorAll('.select-theme__item');

        if (localTheme) {
            selectThemeItemElem ?
                selectThemeItemElem.forEach(function (elem) {
                    if (elem.text.trim() === localTheme) {
                        elem.classList.add('is-active');
                    } else {
                        elem.classList.remove('is-active');
                    }
                }) : null;
        }

        selectThemeItemElem ?
            selectThemeItemElem.forEach(function (v, i) {
                v.addEventListener('click', function (e) {
                    var selectedThemeVariant = e.target.text.trim();
                    localStorage.setItem('theme', selectedThemeVariant);

                    rootEleme.removeAttribute('class');
                    rootEleme.classList.add(`theme__${selectedThemeVariant}`);
                    selectThemeElem.forEach(function(rootElem) {
                        rootElem.querySelectorAll('a').forEach(function (elem) {
                            if (elem.classList) {
                                if (elem.text.trim() === selectedThemeVariant) {
                                    if (!elem.classList.contains('is-active')) {
                                        elem.classList.add('is-active');
                                    }
                                } else {
                                    if (elem.classList.contains('is-active')) {
                                        elem.classList.remove('is-active');
                                    }
                                }
                            }
                        });
                    });

                    if (window.mermaid) {
                        if (selectedThemeVariant === "dark" || selectedThemeVariant === "hacker") {
                            mermaid.initialize({ theme: 'dark' });
                            location.reload();
                        } else {
                            mermaid.initialize({ theme: 'default' });
                            location.reload();
                        }
                    }

                    var utterances = document.querySelector('iframe');
                    if (utterances) {
                        utterances.contentWindow.postMessage({
                            type: 'set-theme',
                            theme: selectedThemeVariant === "dark" || selectedThemeVariant === "hacker" ? 'photon-dark' : selectedThemeVariant === 'kimbie' ? 'github-dark-orange' : 'github-light',
                        }, 'https://utteranc.es');
                    }
                });
            }) : null;
        // ============================================================


        // ========================== search ==========================

        if (document.querySelector('#search')) {
            // //https://www.algolia.com/doc/api-reference/api-parameters/facetFilters/?language=javascript
            // let algoliaOptions = {
            //     hitsPerPage: 10,
            //
            //     //facetFilters: facetFilters,
            // };
            //
            // // if(/404.html/.test(window.location.pathname)){
            // //     delete algoliaOptions.facetFilters;
            // // }
            //
            // window.docsearch({
            //     appId: algoliaAppId,
            //     apiKey: algoliaKey,
            //     indexName: algoliaIndex,
            //     inputSelector: "#search",
            //     algoliaOptions: algoliaOptions,
            //     // debug: true,
            // });
        }

        // ============================================================


        // ========================== popup  ==========================
        document.querySelectorAll('.popup-modal').forEach(function(elem) {
            elem.onclick = function (event) {
                if (event.target === elem){
                    document.body.classList.remove('modal-open');
                    elem.classList.remove('show');
                }
            }
        });

        document.querySelectorAll('.popup-modal .btn-close[data-action="close"]').forEach(function(elem) {
            elem.onclick = function () {
                document.body.classList.remove('modal-open');
                elem.closest(".popup-modal").classList.remove('show');
            }
        });

        // ============================================================

    };


    //
    // Return objects assigned to module
    //
    var _generateID = function () {
        // Math.random should be unique because of its seeding algorithm.
        // Convert it to base 36 (numbers + letters), and grab the first 9 characters
        // after the decimal.
        return '_' + Math.random().toString(36).substr(2, 9);
    };

    var _showAnnounce = function (){
        var show_class = sessionStorage.getItem('announce');
        if (show_class == null){
            show_class = 'show';
        }

        document.getElementById('announce').classList.remove('hide');
        document.getElementById('announce').classList.add(show_class);
    }

    var _hideAnnounce = function(){
        sessionStorage.setItem('announce', 'hide');
        document.getElementById('announce').classList.add('hide');
    }

    return {

        // Disable transitions before page is fully loaded
        initBeforeLoad: function () {
        },

        // Enable transitions when page is fully loaded
        initAfterLoad: function () {
            _initLayout();
            _showAnnounce();
        },

        // Initialize all components
        initComponents: function () {
        },


        initElements: function () {

        },

        commonHanlde: function () {
        },


        // Initialize core
        initCore: function () {
            App.initComponents();
            App.initElements();

            App.commonHanlde();
        },

        showPopup: function (id){
            let popup = document.getElementById(id);
            if (popup){
                document.body.classList.add('modal-open');
                popup.classList.add('show');
            }
        },

        hidePopup: function (id){
            let popup = document.getElementById(id);
            if (popup){
                document.body.classList.remove('modal-open');
                popup.classList.remove('show');
            }
        },

        hideAnnounce: function (){
            _hideAnnounce();
        }
    }
}();

// Initialize module
// ------------------------------

// When content is loaded
document.addEventListener('DOMContentLoaded', function () {
    App.initBeforeLoad();
    App.initCore();
});

// When page is fully loaded
window.addEventListener('load', function () {
    App.initAfterLoad();
});

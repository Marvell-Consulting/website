      (function (window, document) {
      var menu = document.getElementById('menu'),
          WINDOW_CHANGE_EVENT = ('onorientationchange' in window) ? 'orientationchange':'resize';

      function toggleHorizontal() {
          [].forEach.call(
              document.getElementById('menu').querySelectorAll('.custom-can-transform'),
              function(el){
                  el.classList.toggle('pure-menu-horizontal');
              }
          );
      };

      function toggleMenu() {
          // set timeout so that the panel has a chance to roll up
          // before the menu switches states
          if (menu.classList.contains('open')) {
              setTimeout(toggleHorizontal, 500);
          }
          else {
              toggleHorizontal();
          }
          menu.classList.toggle('open');
          document.getElementById('toggle').classList.toggle('x');
      };

      function closeMenu() {
          if (menu.classList.contains('open')) {
              toggleMenu();
          }
      }

      document.getElementById('toggle').addEventListener('click', function (e) {
          toggleMenu();
          e.preventDefault();
      });

      window.addEventListener(WINDOW_CHANGE_EVENT, closeMenu);

    
    // focus on the contained link when hovering on the element .case-study-link
    const caseStudyLinks = document.querySelectorAll('.case-study-link');
    
    caseStudyLinks.forEach((caseStudy) => {
        const linkAnchor = caseStudy.querySelector(":scope > a");
        let hasClass = linkAnchor.classList.contains('focus');
        
        caseStudy.addEventListener('mouseover', (e) => {
            if (!hasClass) {
                linkAnchor.classList.add('focus');
            }
        });

        caseStudy.addEventListener('click', (e) => {
            //trigger click on link
            linkAnchor.click();
        });

        caseStudy.addEventListener('mouseout', (e) => {
            if (!hasClass) {
                linkAnchor.classList.remove('focus');
            }
        });
    });

    })(this, this.document);

let currentIndex = 0;
let imgNotScrolled = true;
let logoClicks = 0;
const images = document.querySelectorAll('.carousel-images img');
const totalImages = images.length;

const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');

function updateCarousel() {
    const offset = -currentIndex * 100;
    document.querySelector('.carousel-images').style.transform = `translateX(${offset}%)`;
}

prevBtn.addEventListener('click', function () {
    imgNotScrolled = false;
    currentIndex = (currentIndex === 0) ? totalImages - 1 : currentIndex - 1;
    updateCarousel();
});

nextBtn.addEventListener('click', function () {
    imgNotScrolled = false;
    currentIndex = (currentIndex === totalImages - 1) ? 0 : currentIndex + 1;
    updateCarousel();
});

setInterval (function(){
   if (imgNotScrolled) {
        currentIndex = (currentIndex === totalImages - 1) ? 0 : currentIndex + 1;
        updateCarousel();
   }
}, 3000)


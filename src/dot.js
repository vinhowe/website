function setupFunDot() {
  const funDotElement = document.getElementById("fun-dot");
  const funDotBgElement = document.getElementById("fun-dot-bg");
  const outerBoxElement = document.getElementById("outer-box");
  let velocityX = 0;
  let velocityY = 0;
  let dotX = 0.5;
  let dotY = -0.5;
  let dotOffsetX = 0.5;
  let dotOffsetY = -0.5;
  const mouseMoveHandler = (x, y) => {
    // Get mouse position relative to the outer box
    const boxX = x - outerBoxElement.offsetLeft;
    const boxY = y - outerBoxElement.offsetTop;
    const xPercent = boxX / outerBoxElement.offsetWidth;
    const yPercent = boxY / outerBoxElement.offsetHeight;
    if (xPercent < 0 || xPercent > 1 || yPercent < 0 || yPercent > 1) {
      dotOffsetX = 0;
      dotOffsetY = 0;
      return;
    }
    dotOffsetX = xPercent - 0.5;
    dotOffsetY = yPercent - 0.5;
  };

  // Handle mouse move
  document.addEventListener("mousemove", function (event) {
    mouseMoveHandler(event.clientX, event.clientY);
  });

  // Handle touch move
  document.addEventListener("touchmove", function (event) {
    mouseMoveHandler(event.touches[0].clientX, event.touches[0].clientY);
  });

  // Handle touch end
  document.addEventListener("touchend", function (event) {
    mouseMoveHandler(-1, -1);
  });

  // Handle mouse leave
  document.addEventListener("mouseleave", function (event) {
    mouseMoveHandler(-1, -1);
  });

  // Animates the dot
  function animate() {
    // Scale the dot offset
    velocityX = velocityX * 0.9 + (dotOffsetX - dotX) * 0.1;
    velocityY = velocityY * 0.9 + (dotOffsetY - dotY) * 0.1;
    velocityX *= 0.5;
    velocityY *= 0.5;
    // Update the dot position
    dotX += velocityX;
    dotY += velocityY;
    // Take abs of the dot position, multiply by 2, pow by 0.5, multiply by sign, then divide by 2 again
    dotX = Math.sign(dotX) * Math.pow(Math.abs(dotX) * 2, 0.85) / 2;
    dotY = Math.sign(dotY) * Math.pow(Math.abs(dotY) * 2, 0.85) / 2;
    const dotDistance = Math.sqrt(Math.abs(dotX * dotX) * 2 + Math.abs(dotY * dotY) * 2);

    // Update the dot position
    funDotElement.style.transform = `translate(${dotX * 20}px, ${dotY * 20}px)`;
    // Update the background blur
    funDotBgElement.style.filter = `blur(${dotDistance * 3}px) saturate(${1 - (dotDistance * 0.5)})`;
    // Update the background position
    funDotBgElement.style.transform = `translate(${-dotX * 10}px, ${-dotY * 10}px)`;
    requestAnimationFrame(animate);
  }
  animate();
}

window.addEventListener("load", function () {
  setupFunDot();
});

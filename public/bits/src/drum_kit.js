var prajapati= document.querySelectorAll(".drum")
for (i = 0; i <(prajapati).length; i++ ) {
    prajapati[i].addEventListener("click", function () {
        var buttonInnerHTML = this.innerHTML;

            buttonanimation(buttonInnerHTML)

        switch (buttonInnerHTML) {
            case "w":
                var audio = new Audio("sounds/tom-1.mp3");
                audio.play();
                break;

            case "a":
                var audio = new Audio('sounds/tom-2.mp3');
                audio.play();
                break;

            case "s":
                var audio = new Audio('sounds/tom-3.mp3');
                audio.play();
                break;

            case "d":
                var audio = new Audio('sounds/tom-4.mp3');
                audio.play();
                break;

            case "j":
                var audio = new Audio('sounds/snare.mp3');
                audio.play();
                break;

            case "k":
                var audio = new Audio('sounds/crash.mp3');
                audio.play();
                break;

            case "l":
                var audio = new Audio('sounds/kick-bass.mp3');
                audio.play();
                break;

            default:
                alert("nothing remains")
                break;
        }
    } );
}

document.addEventListener("keydown", function(event){

    var keypress = event.key

    buttonanimation(event.key)

    switch (keypress) {
        case "w":
            var audio = new Audio("sounds/tom-1.mp3");
            audio.play();
            break;

        case "a":
            var audio = new Audio('sounds/tom-2.mp3');
            audio.play();
            break;

        case "s":
            var audio = new Audio('sounds/tom-3.mp3');
            audio.play();
            break;

        case "d":
            var audio = new Audio('sounds/tom-4.mp3');
            audio.play();
            break;

        case "j":
            var audio = new Audio('sounds/snare.mp3');
            audio.play();
            break;

        case "k":
            var audio = new Audio('sounds/crash.mp3');
            audio.play();
            break;

        case "l":
            var audio = new Audio('sounds/kick-bass.mp3');
            audio.play();
            break;

        default:
            break;
    }

})

function buttonanimation(currentKey){
    document.querySelector("."+currentKey).classList.add("pressed");
    setTimeout(function(){
        document.querySelector("."+currentKey).classList.remove("pressed")
    },100);

}

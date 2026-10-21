const values_bro = ["green", "red", "yellow", "blue"]
const list_hai_bro = []
var score = 0
var colored = $(".green")
var color = $(".green")
var gameover = false
var jabbar = 0

hello_world()

function gajjabb (input){
    var i = input
    colored = color
    color = $("."+values_bro[list_hai_bro[i]])
    setTimeout(function(){
        setTimeout(function(){
            colored.css("opacity","1")
        },1800)
        color.css("opacity", "0.5")
        if(i< list_hai_bro.length){
            gajjabb(i+1)
        }},2000)}


function click_karo(number_hai){
    if (number_hai< list_hai_bro.length){
        pappa = $("."+values_bro[list_hai_bro[number_hai]])
        for (let j=0; j< 3; j++){
            if (values_bro[j] === pappa){
                pappa.click(function(){
                    score++;
                    click_karo(number_hai++);
                    jabbar = 1
                })}
            else {
                $(values_bro[j]).click(function(){
                    gameover = true;
                    jabbar = 3
                })
            }
            if (gameover === true) break;
            }
            }
        }

function hello_world(){
    list_hai_bro.push(Math.floor(Math.random()*4))
    gajjabb(0)
    color.css("opacity","1")
    click_karo(0)
    if (jabbar===1){
        score++
        hello_world()
    }
    else if (jabbar ===3){
        $("h1").text("You lost your score is" + score)
    }
        }
    // gameover = true}
    // for (let j=0; j < list_hai_bro.length; j++){
    //     var red_click = $(".red")
    //     var blue_click = $(".blue")
    //     var green_click = $(".green")
    //     var yellow_click = $(".yellow")
    //     const clicked = [red_click,blue_click,green_click,yellow_click]
    //     var patel = $("."+values_bro[list_hai_bro[j]])
    //     patel.click(function(){
    //     })
    //     for (i=0;i=3;i++){
    //         if (clicked[i]!==patel){
    //             clicked[i].click(function(){
    //                 gameover = true;

    //             })
    //         }
    //     }

    // }

    // for (let i=0; i < list_hai_bro.length; i++){
    //     colored = color
    //     color = $("."+values_bro[list_hai_bro[i]])
    //     setTimeout(function(){
    //         colored.css("opacity","1")
    //         color.css("opacity", "0.5")},500)
    //         sleep(0.5)
    //     alert("hello")

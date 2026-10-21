# ===== turtle-crossing/main.py =====
import time
from running_turtle import Running_Turtle
from cars_moving import Cars,screen
import random
def game_chalu_chhe():

    screen.listen()
    screen.tracer(0)
    running_turtle = Running_Turtle()

    k = []
    vashisth = 10
    while vashisth >= 10:

        w = [ 0, 40, 80, 120, 160, -40, -120, -160]
        p = random.randint(0, 1)
        for i in range(0, p):
            car = Cars((300, random.choice(w)))
            k.append(car)

        for q in k:
            if q.xcor() < -350:
                k.remove(q)

        for c in k:
            if  (c.ycor() - running_turtle.ycor() >= -10 and c.ycor() - running_turtle.ycor() <= 10) :
                if (c.xcor() - running_turtle.xcor() >= -40 and c.xcor() - running_turtle.xcor() <= 40):
                    vashisth = 1
                    break

            if running_turtle.ycor() > 200:
                screen.clearscreen()
                c.new_game()

                game_chalu_chhe()
            else:
                c.move_turtle()
        vashisth = vashisth + 1
        screen.update()
        while vashisth == 50:

            screen.onkey(running_turtle.go_up, "Up")
            break

        time.sleep(0.1)


game_chalu_chhe()


screen.exitonclick()


# ===== turtle-crossing/running_turtle.py =====
from turtle import Turtle

class Running_Turtle(Turtle):
    def __init__(self):
        super().__init__()
        self.shape("turtle")
        self.penup()
        self.setheading(90)
        self.color("black")
        self.goto(0,-190)
        self.shapesize(1.2)

    def go_up(self):
        self.forward(30)


# ===== turtle-crossing/cars_moving.py =====
from turtle import Turtle, Screen
import random

screen = Screen()

screen.bgcolor("white")
screen.screensize(600,400)

class Cars(Turtle):
    def __init__(self,position):
        super().__init__()
        self.shape("square")
        self.shapesize(1,3)
        self.setheading(180)
        self.penup()
        self.color(random.choice(["red", "green", "yellow", "pink", "purple", "orange"]))
        self.goto(position)
        self.speedd = 20

    def move_turtle(self):
        self.forward(self.speedd)

    def new_game(self):
        self.speedd *= 2



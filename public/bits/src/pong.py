# ===== pong/main.py =====

from scating import Slider_1, Slider_2 ,turtle, ttuurrttllee
from ball import Ball, ball_nameee, screen
from turtle_border import Turtle_border


screen.update()

screen.tracer(0)
turtle_border = Turtle_border()
ball_name = Ball()
slider_1 = Slider_1()
slider_2 = Slider_2()

screen.listen()
screen.onkey(fun= slider_1.slider1_move_up, key = "Up")
screen.onkey(fun= slider_1.slider1_move_down, key = "Down")
screen.onkey(fun= slider_2.slider2_move_up, key = "w")
screen.onkey(fun= slider_2.slider2_move_down, key = "s")

while ball_nameee[0].xcor() > -(1000-1)/2 and ball_nameee[0].xcor() < (1000-1)/2 :

    screen.update()

    if ball_nameee[0].ycor() > (800-20)/2 and ball_nameee[0].heading() == 45:
        ball_nameee[0].setheading(315)
    elif ball_nameee[0].ycor() > (800 - 20) / 2 and ball_nameee[0].heading() == 135:
        ball_nameee[0].setheading(225)
    elif ball_nameee[0].ycor() < -(800-20)/2 and ball_nameee[0].heading() == 315:
        ball_nameee[0].setheading(45)
    elif ball_nameee[0].ycor() < -(800-20)/2 and ball_nameee[0].heading() == 225:
        ball_nameee[0].setheading(135)

    for i in turtle:
        if ball_nameee[0].distance(i) < 10 and ball_nameee[0].heading() == 45 :
            ball_nameee[0].setheading(135)
        elif ball_nameee[0].distance(i) < 10 and ball_nameee[0].heading() == 315 :
            ball_nameee[0].setheading(225)

    for j in ttuurrttllee:
        if ball_nameee[0].distance(j) < 10 and ball_nameee[0].heading() == 135 :
            ball_nameee[0].setheading(45)
        elif ball_nameee[0].distance(j) < 10 and ball_nameee[0].heading() == 225 :
            ball_nameee[0].setheading(315)

    ball_nameee[0].forward(4)


screen.exitonclick()


# ===== pong/ball.py =====
from turtle import Turtle,Screen
import random

screen = Screen()
screen.bgcolor("black")
screen.screensize(1000,600)
ball_nameee = []

class Ball():
    def __init__(self):
        t = Turtle()
        t.shapesize(1)
        initial_heading = random.choice([45,135,225,315])
        t.setheading(initial_heading)
        t.shape("circle")
        t.color("white")
        t.penup()
        random_number1 = random.randint(-500,500)

        t.goto(random_number1,0)
        ball_nameee.append(t)


    def ball_turn_down_right(self):
        ball_nameee[0].setheading(315)

    def ball_turn_down_left(self):
        ball_nameee[0].setheading(225)

    def ball_turn_up_right(self):
        ball_nameee[0].setheading(45)

    def ball_turn_up_left(self):
        ball_nameee[0].setheading(135)


# ===== pong/scating.py =====
from turtle import Turtle
from ball import screen

turtle = []
ttuurrttllee = []

class Slider_1():

    def __init__(self):

        for i in range (0,10):

            t = Turtle()
            t.color("white")
            t.shapesize(1)
            t.shape("square")
            t.penup()
            t.goto((1000/2)-20, -32+16*i)
            t.setheading(90)
            turtle.append(t)


    def slider1_move_up(self):
        for i in turtle:
            i.forward(32)

    def slider1_move_down(self):
        for i in turtle:
            i.backward(32)

class Slider_2():

    def __init__(self):

        for i in range(0, 10):
            t = Turtle()
            t.color("white")
            t.shapesize(1)
            t.shape("square")
            t.penup()
            t.goto((-(1000 / 2) + 20), -32 + 16*i)
            t.setheading(90)
            ttuurrttllee.append(t)

    def slider2_move_up(self):
        for i in ttuurrttllee:
            i.forward(32)

    def slider2_move_down(self):
        for i in ttuurrttllee:
            i.backward(32)


# ===== pong/turtle_border.py =====
from turtle import Turtle

class Turtle_border():
    def __init__(self):
        for i in range (0,159):
            t = Turtle()
            t.shape("square")
            t.color("white")
            t.penup()
            t.shapesize(0.5)
            t.goto( 495 ,-395+ i*5)
            l = Turtle()
            l.shape("square")
            l.color("white")
            l.penup()
            l.shapesize(0.5)
            l.goto(-495, -395 + i * 5)
        for i in range(0,199):
            p = Turtle()
            p.shape("square")
            p.color("white")
            p.penup()
            p.shapesize(0.5)
            p.goto(-495 + i * 5,395 )
            q = Turtle()
            q.shape("square")
            q.color("white")
            q.penup()
            q.shapesize(0.5)
            q.goto(-495 + i * 5,-395)

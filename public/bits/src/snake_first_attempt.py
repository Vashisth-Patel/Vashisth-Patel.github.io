# ===== snake-first-attempt/Snake_Game.py =====
from turtle import Turtle, Screen
import random

turtle_object_list = []
screen = Screen()
screen.title("here the game starts")
screen.setup(width=1000, height=1000)
screen.bgcolor("black")
screen.title("Snake game")
turtle_1 = Turtle()
turtle_2 = Turtle()

turtle_object_list.append(turtle_1)
turtle_object_list.append(turtle_2)
turtle_2.penup()
turtle_2.goto(-15, 0)


def turtle_na_guno():
    for i in turtle_object_list:
        i.color("white")
        i.shape("square")
        i.shapesize(0.5, 1, 0)
        i.speed(5)


def new_added_turtle():
    turtle_object_list[-1].color("white")
    turtle_object_list[-1].shape("square")
    turtle_object_list[-1].shapesize(0.5, 1, 0)
    turtle_object_list[-1].speed(5)
    turtle_object_list[-1].penup()
    if turtle_object_list[-2].heading() == 90:
        turtle_object_list[-1].goto(turtle_object_list[-2].xcor(), turtle_object_list[-2].ycor() - 15)
    elif turtle_object_list[-2].heading() == 180:
        turtle_object_list[-1].goto(turtle_object_list[-2].xcor() + 15, turtle_object_list[-2].ycor())
    elif turtle_object_list[-2].heading() == 270:
        turtle_object_list[-1].goto(turtle_object_list[-2].xcor(), turtle_object_list[-2].ycor() + 15)
    elif turtle_object_list[-2].heading() == 0:
        turtle_object_list[-1].goto(turtle_object_list[-2].xcor() - 15, turtle_object_list[-2].ycor())
    turtle_object_list[-1].setheading(turtle_object_list[-2].heading())


turtle_na_guno()

random_food_turtle = Turtle()


def random_dot_location():
    global random_food_turtle
    random_x_coordinate_of_food = random.randint(-195, 195)
    random_y_coordinate_of_food = random.randint(-195, 195)

    random_food_turtle.penup()
    random_food_turtle.color("white")
    random_food_turtle.shape("circle")
    random_food_turtle.shapesize(0.5)
    random_food_turtle.goto(random_x_coordinate_of_food, random_y_coordinate_of_food)


random_dot_location()


screen.onkey(fun=f, key="Up")
screen.listen()


def g():
    if turtle_object_list[0].heading() == 90 or turtle_object_list[0].heading() == 270:
        turtle_1_position = turtle_object_list[0].pos()
        for i in turtle_object_list:

            while i.pos() != turtle_1_position:
                for j in turtle_object_list:
                    j.forward(5)
            if i.pos() == turtle_1_position:
                i.setheading(180)


screen.onkey(fun=g, key="Left")


def h():
    if turtle_object_list[0].heading() == 0 or turtle_object_list[0].heading() == 180:
        turtle_1_position = turtle_object_list[0].pos()
        for i in turtle_object_list:

            while i.pos() != turtle_1_position:
                for j in turtle_object_list:
                    j.forward(5)
            if i.pos() == turtle_1_position:
                i.setheading(270)


screen.onkey(fun=h, key="Down")


def i():
    if turtle_object_list[0].heading() == 90 or turtle_object_list[0].heading() == 270:
        turtle_1_position = turtle_object_list[0].pos()
        for i in turtle_object_list:

            while i.pos() != turtle_1_position:
                for j in turtle_object_list:
                    j.forward(5)
            if i.pos() == turtle_1_position:
                i.setheading(0)


screen.onkey(fun=i, key="Right")
pp = 0
papa = True
while papa:

    for i in turtle_object_list:
        i.forward(5)
    if random_food_turtle.xcor() + 5 >= turtle_object_list[0].xcor() >= random_food_turtle.xcor() - 5 and \
            turtle_object_list[0].ycor() <= random_food_turtle.ycor() + 5 and turtle_object_list[
        0].ycor() >= random_food_turtle.ycor() - 5:
        pp += 1
        screen.title(f"your score is {pp}")
        new_turtle = Turtle()
        turtle_object_list.append(new_turtle)
        new_added_turtle()
        random_dot_location()
    for i in turtle_object_list:
        for j in turtle_object_list:
            if i != j and i.pos() == j.pos():
                print("the game is over")
                papa = False
        if i.xcor() >= 500 or i.xcor() <= -500 or i.ycor() >= 500 or i.ycor() <= -500:
            print("Game over buddy")
            papa = False

screen.exitonclick()

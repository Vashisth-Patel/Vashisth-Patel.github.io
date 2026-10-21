# ===== snake/main.py =====
import time
from food import Food
from snake import Snake,screen,all_turtle

snake = Snake()

screen.setup(width= 600, height= 600)
screen.bgcolor("black")
screen.title("Snake")
screen.tracer(0)
game_om = True
screen.listen()
screen.onkey(fun= snake.f , key= "Up")
screen.onkey(fun= snake.g , key= "Left")
screen.onkey(fun= snake.h , key= "Down")
screen.onkey(fun= snake.i , key= "Right")
foood_turtle = Food()
score = 0
while game_om:


    screen.update()
    time.sleep(0.05)

    if all_turtle[0].xcor() >= screen.window_width()/2 or all_turtle[0].xcor() <= -screen.window_width()/2 or all_turtle[0].ycor() >= screen.window_height()/2 or all_turtle[0].ycor() <= -screen.window_height()/2:
        game_om = False
        print("GAME OVER")


    elif all_turtle[0].distance(foood_turtle) < 20:
        score += 1
        screen.title(f"your_score_is {score}")
        foood_turtle.new_coordinate_son()
        snake.extend()

    for segment in range(0,len(all_turtle)):

        if all_turtle[0].distance(all_turtle[segment]) < 5 and segment != 0:
            game_om = False
            print("GAME OVER not ob")

    snake.move()


screen.exitonclick()

# ===== snake/snake.py =====
from turtle import Turtle,Screen
import time
screen = Screen()
all_turtle = []

class Snake:

    def __init__(self):

        turtle_1 = Turtle("square")
        turtle_2 = Turtle("square")
        turtle_3 = Turtle("square")
        all_turtle.append(turtle_1)
        all_turtle.append(turtle_2)
        all_turtle.append(turtle_3)
        for i in range(0,len(all_turtle)):
            all_turtle[i].color("white")
            all_turtle[i].penup()
            all_turtle[i].shapesize(0.5,0.5)
            all_turtle[i].goto(-i*10 , 0)

    def extend(self):
        new_turtle =Turtle()
        new_turtle.penup()
        new_turtle.shapesize(0.5, 0.5)
        new_turtle.color("white")
        new_turtle.shape("square")
        new_turtle.setheading(all_turtle[-1].heading())
        new_turtle.goto(all_turtle[-1].pos())
        all_turtle.append(new_turtle)


    def move(self):

        for i in range(0,len(all_turtle)-1):

            all_turtle[-i-1].goto(all_turtle[-i-2].pos())
        all_turtle[0].forward(10)


    def f(self):

        if all_turtle[0].heading() == 0 or all_turtle[0].heading() == 180:

            for i in range(0,len(all_turtle)):
                all_turtle[i].setheading(90)


    def g(self):

        if all_turtle[0].heading() == 90 or all_turtle[0].heading() == 270:

            for i in range(0, len(all_turtle)):
                all_turtle[i].setheading(180)


    def h(self):

        if all_turtle[0].heading() == 0 or all_turtle[0].heading() == 180:

            for i in range(0, len(all_turtle)):
                all_turtle[i].setheading(270)


    def i(self):

        if all_turtle[0].heading() == 90 or all_turtle[0].heading() == 270:

            for i in range(0, len(all_turtle)):
                all_turtle[i].setheading(0)


# ===== snake/food.py =====
import random
from turtle import Turtle
from snake import screen

class Food(Turtle):
    def __init__(self):
        super().__init__()
        random_x_cor = random.randint((-screen.window_width()/2)+100, (screen.window_width()/2)-100)
        random_y_cor = random.randint((-screen.window_height()/2)+100, (screen.window_height()/2)-100)

        self.penup()
        self.color("white")
        self.goto(random_x_cor,random_y_cor)
        self.shape("circle")
        self.shapesize(0.5,0.5)

    def new_coordinate_son(self):
        random_x_cor = random.randint(-screen.window_width() / 2, screen.window_width() / 2)
        random_y_cor = random.randint(-screen.window_height() / 2, screen.window_height() / 2)
        self.goto(random_x_cor,random_y_cor)

# ===== snake/scoreboard.py =====
# (empty file)

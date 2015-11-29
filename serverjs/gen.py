#! /usr/bin/env python3

import sys
import os.path
import random
import math

def main():
  _path = "sin2.txt"
  _number = 1000000
  _range_max = 200
  _range_min = 50
  _x_max = 500
  _x_min = 0

  argv = sys.argv;
  argc = len(argv)

  if(argc == 2):
    _path = sys.argv[1];
  elif(argc == 3):
    _range_max = int(argv[1])
    _range_min = int(argv[2])
  elif(argc == 4):
    _path = (argv[1])
    _range_max = int(argv[2])
    _range_min = int(argv[3])


  fout = open(os.path.abspath(_path), 'w')
  fout.write(str(_x_min) + " " + str(_x_max) + "\n");
  fout.write(str(_range_min) + " " + str(_range_max) + "\n");

  fout.write(str(_number) + "\n");

  for i in range(_number):
    tmp = math.sin(i/30000)*120 +  math.sin(i/1000)*100 +  math.sin(50*i) + (math.sin(i/20) * 60);
    if(random.randint(0,1000) % 100  == 0):
      tmp *= 3
    sin_line = (_range_max + 600) + tmp
    number = sin_line + (random.randint(5, 20) * math.sin(i))
    fout.write(str(number) + " ")
  fout.write("\n")
  for i in range(_number):
    tmp = (math.sin(i/20) * 100);
    if(random.randint(0,1000) % 100  == 0):
      tmp *= 3
    sin_line = (_range_max + 600) + tmp
    number = sin_line + (random.randint(5, 20) * math.sin(i)) + 900
    fout.write(str(number) + " ")
  fout.write("\n")



main()







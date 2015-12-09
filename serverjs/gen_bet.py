#! /usr/bin/env python3

import sys
import os.path
import random
import math

def main():
  _path = "num.txt"
  _number = 1000000
  _range_max = 5500
  _range_min = -1500
  _x_max = 500
  _x_min = 0
  _channels = 10

  argv = sys.argv;
  argc = len(argv)

  if(argc == 2):
    _path = argv[1]
  elif(argc == 3):
    _path = argv[1]
    _channels = int(argv[2])
    

  _range_max = 1000 + _channels * 1000
  _range_min = - 1500

  fout = open(os.path.abspath(_path), 'w')
  fout.write(str(_x_min) + " " + str(_x_max) + "\n");
  fout.write(str(_range_min) + " " + str(_range_max) + "\n");
  fout.write(str(_number) + "\n");
  

  begin = 0
  
  for N in range(_channels):
    for i in range(_number):
      tmp = math.sin(i/30000)*550  + math.sin(i/1000)*225 + math.sin(50*i) + (math.sin(i/20) * 60);
      number = begin + tmp + (random.randint(5, 20) * math.sin(i/2000))
      fout.write(str(number) + " ")
    fout.write("\n")
    begin += 900



main()







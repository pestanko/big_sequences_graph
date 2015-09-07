__author__ = 'wermington'

import os.path
import numpy
import h5py
import math
import logging

TILE_SIZE = 10

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class Level:
    def __init__(self, n_tiles, index, n_chan):
        self._tiles = [n_tiles]
        self._index = index
        self._num_tiles = n_tiles

        for i in range(0, n_tiles):
            tile = [n_chan]
            self.build_tile(tile, n_chan)

    @property
    def tiles(self):
        return self._tiles

    @property
    def index(self):
        return self._index

    @property
    def n_tiles(self):
        return self._num_tiles

     @staticmethod
     def build_channel():
        channel = [2] ## MIN_MAX
        channel[0] = [TILE_SIZE] # MIN
        channel[1] = [TILE_SIZE] #MAX
        return channel

    def build_tile(self, tile, n_tiles):
        for i in range(0, n_tiles):
            chan = self.build_channel()
            tile[i] = chan

    def add_data(self, index, offset, data):
        if index >= self._num_tiles:
            logger.error("[ERROR]: Index too high {0} ".format(index))
            return

        tile = self.tiles[index]

        if offset > TILE_SIZE:
            logger.error("[ERROR]: Offset too high {0} ".format(offset))
            return
        tile[offset] = data


class Holder:
    def __init__(self, n_levels = 5, data_size= 1000000, n_chan = 1):
        self._levels = [n_levels]
        self._levels_num = n_levels
        self.tile_size = TILE_SIZE
        self._data_size = data_size
        for i in range(0, n_levels):
            lvl_size = self.count_level_tiles(i)
            level = Level(n_tiles=lvl_size, index=i, n_chan=n_chan)
            self.levels[i] = level

    @property
    def levels(self):
        return self._levels


    @property
    def num_levels(self):
        return self._levels_num

     def count_level_tiles(self, index):
        max_offset = self._levels_num - 1
        diff = max_offset - index

        num = self._data_size/self.tile_size ## First Step
        for i in range(0, diff):
            num = math.ceil(num/self.tile_size) ## Iterative
        return num


    def add_data(self, level, index, offset, data):
        if level >= self._levels_num:
            logger.error("[ERROR]: Level too high {0}".format(level))
            return

        lvl = self.levels[level]
        lvl.add_data(index, offset, data)

    def get_tile(self, level, index):
        if level >= self._levels_num:
            logger.error("[ERROR]: Level too high {0}".format(level))
            return None
        return self.levels[index]




class Application:
    def __init__(self, filepath, h5path, matrixPath = None, matrixFile = None):
        self.filepath = filepath
        self.h5path = h5path
        self.matrixPath = matrixPath
        self.matrixFile = matrixFile

        self.h5file = h5py.File(self.filepath, "r")
        self.data = self.h5file[h5path]

        if matrixFile is not None:
            h = h5py.File(matrixFile, 'r')
            self.levels = loadMatrix(h, matrixPath)
        elif 'minmax' in f:
          self.levels = loadMatrix(self.h5file, matrixPath)





def  main():
    filepath = os.path.abspath("./data.h5")
    h5path = '/eeg_raw/raw'





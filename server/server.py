__author__ = 'wermington'

import os.path
import numpy as np
import h5py
import math
import logging
import minmax

TILE_SIZE = 10

FORMAT = " <%(asctime)-15s> {%(filename)s:%(lineno)s - %(funcName)s()} [%(levelname)s]: %(message)s"
logging.basicConfig(format=FORMAT, level=logging.DEBUG)


class Level:
	def __init__(self, n_tiles, index, n_chan):
		self.logger = logging.getLogger(__name__)
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
		channel = [2]  ## MIN_MAX
		channel[0] = [TILE_SIZE]  # MIN
		channel[1] = [TILE_SIZE]  # MAX
		return channel

	def build_tile(self, tile, n_tiles):
		for i in range(0, n_tiles):
			chan = self.build_channel()
			tile[i] = chan

	def add_data(self, index, offset, data):
		if index >= self._num_tiles:
			self.logger.error(" Index too high {0} ".format(index))
			return

		tile = self.tiles[index]

		if offset > TILE_SIZE:
			self.logger.error("Offset too high {0} ".format(offset))
			return
		tile[offset] = data


class Holder:
	def __init__(self, n_levels=5, data_size=1000000, n_chan=1):
		self._levels = [n_levels]
		self.logger = logging.getLogger(__name__)
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

		num = self._data_size / self.tile_size  ## First Step
		for i in range(0, diff):
			num = math.ceil(num / self.tile_size)  ## Iterative
		return num

	def add_data(self, level, index, offset, data):
		if level >= self._levels_num:
			logger.error("Level too high {0}".format(level))
			return

		lvl = self.levels[level]
		lvl.add_data(index, offset, data)

	def get_tile(self, level, index):
		if level >= self._levels_num:
			self.logger.error("Level too high {0}".format(level))
			return None
		return self.levels[index]


class Application:
	def __init__(self, file_path, h5path, matrix_path=None, matrix_file=None):
		self.file_path = file_path
		self.h5path = h5path
		self.matrix_path = matrix_path
		self.matrix_file = matrix_file
		self.logger = logging.getLogger(__name__)
		matrix_data = None

		self.h5file = h5py.File(self.file_path, "r+")
		self.data = self.h5file[h5path]

		if 'minmax' not in self.h5file:
			self.generate_minmax()

		if 'minmax' in self.h5file:
			minmax = self.h5file['minmax']
			maxData = minmax['h_max']
			minData = minmax['h_min']
			self.maxDataLevels = [self.data]
			self.minDataLevels = [self.data]
			for l in minData.keys():
				self.minDataLevels.append(minData[l])
			for l in maxData.keys():
				self.maxDataLevels.append(maxData[l])

			pass


	def generate_minmax(self):
		self.logger.info("Generating min max.")
		minmax.create_minmax(self.h5file, self.h5path)


def main():
	import argparse

	parser = argparse.ArgumentParser()
	parser.add_argument('-m', '--matrix', dest="matrix", help="Path to HDF5 Matrix file containing levels.")
	parser.add_argument('-M', '--matrix-path', dest="matrix_path", help="HDF5 path to matrix data.")
	parser.add_argument('-f', '--file', dest="file", help="File path to HDF5 file.")
	parser.add_argument('-p', '--path', dest="path", help="HDF5 path to data.")
	args_namespace = parser.parse_args()

	logger = logging.getLogger(__name__)
	logger.info("Program Started.")

	matrix_path = None
	matrix_file = None
	file_path = os.path.abspath("./testing_data.h5")
	h5path = '/eeg_raw/raw'
	args = vars(args_namespace)

	if args["file"] is not None:
		file_path = args["file"]

	if args['path'] is not None:
		h5path = args["path"]
	if args['matrix'] is not None:
		matrix_file = args["matrix"]
	if args['matrix_path'] is not None:
		matrix_path = args['matrix_path']

	logger.info("File path: %s", file_path)
	logger.info("H5 path: %s", h5path)


	application = Application(file_path=file_path,
														h5path=h5path,
														matrix_path=matrix_path,
														matrix_file=matrix_file)


if __name__ == '__main__':
	main()

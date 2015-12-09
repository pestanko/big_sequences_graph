__author__ = 'Peter Stanko'

import os.path
import numpy as np
import h5py
import math
import logging
import minmax
import json
from websocket_server import WebsocketServer


application = None

TILE_SIZE = 10

FORMAT = " <%(asctime)-15s> {%(filename)s:%(lineno)s - %(funcName)s()} [%(levelname)s]: %(message)s"
logging.basicConfig(format=FORMAT, level=logging.DEBUG)

ws_log = logging.getLogger("WebSocket")


class Tile:
	def build(self):
		return None


class TileMM:
	def __init__(self, index, min_arr, max_arr):
		self.min = min_arr  # channels
		self.max = max_arr  # channels
		self.index = index
		self.logger = logging.getLogger(__name__)

	def build(self):
		array_chan = []

		self.logger.debug("Number of channels: {0}".format(len(self.min)))
		for i in range(len(self.min)):
			min_arr = self.min[i].tolist()
			max_add = self.max[i].tolist()
			m = [min_arr, max_add]
			array_chan.append(m)

		return array_chan


class TileRaw:
	def __init__(self, index, data):
		self.data = data
		self.index = index
		self.logger = logging.getLogger(__name__)

	def build(self):
		array_chan = []
		self.logger.debug("Number of channels: {0}".format(len(self.data)))

		for i in range(len(self.data)):
			data_arr = self.data[i].tolist()
			array_chan.append(data_arr)

		return array_chan


class Application:
	def __init__(self, file_path, h5path, matrix_path=None, matrix_file=None):
		self.file_path = file_path
		self.h5path = h5path
		self.matrix_path = matrix_path
		self.matrix_file = matrix_file
		self.logger = logging.getLogger(__name__)
		self.tile_size = 10

		self.h5file = h5py.File(self.file_path, "r+")
		self.data = self.h5file[h5path]
		self.logger.debug("Data: {0}".format(self.data))
		index_set = self.h5file[h5path]
		self.n_size = index_set.shape[0]
		self.n_levels = 0
		self.n_channels = 0
		self.x_axis = []
		self.y_axis = []

		if 'minmax' not in self.h5file:
			self.logger.info("Creating min max.")
			self.generate_minmax()

		if 'minmax' in self.h5file:
			self.logger.info("Min max found in file")
			minmax = self.h5file['minmax']
			self.logger.debug("MinMax: {0}".format(minmax))
			maxData = minmax['h_max']
			minData = minmax['h_min']
			self.logger.debug("MaxData: {0}".format(maxData))
			self.logger.debug("MinData: {0}".format(minData))

			self.maxDataLevels = []  # [self.data]
			self.minDataLevels = []  # [self.data]

			for l in minData.keys():
				self.minDataLevels.append(minData[l])
			for l in maxData.keys():
				self.maxDataLevels.append(maxData[l])

			lvls = len(self.minDataLevels)

			self.n_levels = lvls
			self.n_channels = len(self.minDataLevels[0])

			self.logger.debug("MaxDataLevels: {0}".format(self.maxDataLevels))
			self.logger.debug("MinDataLevels: {0}".format(self.minDataLevels))

			minv = None
			maxv = None

			for chan in self.minDataLevels[lvls - 1]:
				minv = min(chan)
			for chan in self.maxDataLevels[lvls - 1]:
				maxv = max(chan)

			self.y_axis = [minv - 10, maxv + 10]
			self.x_axis = [0, self.n_size]

	def get_tile_mm(self, level, index):

		lvl_min = self.minDataLevels[level]
		lvl_max = self.maxDataLevels[level]
		#self.logger.debug("Lvl MIN: {0}".format(lvl_min))
		#self.logger.debug("Lvl MAX: {0}".format(lvl_max))

		pos = index * self.tile_size

		pos_min = pos
		pos_max = pos + self.tile_size
		self.logger.info("Requested tile MINMAX @ [{0}, {1}]: [{2}, {3}] ".format(level, index, pos_min, pos_max))

		min_arr = lvl_min[pos_min:pos_max]
		max_arr = lvl_max[pos_min:pos_max]
#		self.logger.debug("Min array: {0}  |  Max array: {1}".format(min_arr, max_arr))

		return TileMM(index, min_arr, max_arr)

	def get_tile_raw(self, level, index):
		index_set = self.h5file[self.h5path]

		pos = index * self.tile_size
		pos_min = pos
		pos_max = pos + self.tile_size
		self.logger.info("Requested tile RAW @ [{0}, {1}]: [{2}, {3}] ".format(level, index, pos_min, pos_max))

		return TileRaw(index, index_set[pos_min:pos_max])

	def get_tile(self, level, index):
		if level > self.n_levels:
			return None

		if level == self.n_levels:
			return self.get_tile_raw(level, index)
		else:
			return self.get_tile_mm(level, index)

	def generate_minmax(self):
		self.logger.info("Generating min max.")
		minmax.create_minmax(self.h5file, self.h5path)

	def get_cfg_msg(self):
		msg = json.dumps(
			{
				"type": "config",
				"x_axis": self.x_axis,
				"y_axis": self.y_axis,
				"levels": self.n_levels + 1,
				"size": self.n_size,
				"tile_size": self.tile_size,
				"channels": self.n_channels
			})

		self.logger.debug("Config message: {0}".format(msg))
		return msg


def new_client(client, server):
	ws_log.debug("New client connected and was given id %d" % client['id'])
	cfg = application.get_cfg_msg()
	ws_log.debug("Sending to client [{0}] cfg message: {1}".format(client, cfg))
	server.send_message(client, cfg)


# Called for every client disconnecting
def client_left(client, server):
	ws_log.debug("Client (%d) disconnected." % client['id'])


# Called when a client sends a message
def message_received(client, server, message):
	ws_log.debug("Received message: {0}".format(message))

	msg = json.loads(message)
	if msg["type"] == "get-tiles":
		res = handle_tiles_message(msg)
		server.send_message(client, res)
	if msg["type"] == "get":
		res = handle_tile_message(msg)
		server.send_message(client, res)


def handle_tiles_message(msg):
	level = msg["level"]
	beg = msg["beg"]
	end = msg["end"]
	raw = "false"
	res_data = []
	ws_log.debug("Received GetTiles message for interval [ {0}, {1} ] @ [{2}]".format(beg, end, level))

	for i in range(beg, end):
		res_data.append(application.get_tile(level, i).build())

	result = json.dumps({
		'type': 'tile-int',
		'beg': beg,
		'end': end,
		'level': level,
		'data': res_data,
		'raw': raw
	})

	return result


def handle_tile_message(msg):
	level = msg["level"]
	index = msg["index"]
	raw = False
	res_data = application.get_tile(level, index).build()
	ws_log.debug("Received GetTiles message for index [ {0} ] @ [{1}]".format(index, level))

	result = json.dumps({
		'type': 'tile',
		'index': index,
		'level': level,
		'data': res_data,
		'raw': raw
	})

	return result


def start_server(port):
	server = WebsocketServer(port)
	ws_log.debug("Server listening on port: %d" % port)
	server.set_fn_new_client(new_client)
	server.set_fn_client_left(client_left)
	server.set_fn_message_received(message_received)
	server.run_forever()


if __name__ == '__main__':
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

	logger.debug("Starting application")

	application = Application(file_path=file_path,
				  h5path=h5path,
				  matrix_path=matrix_path,
				  matrix_file=matrix_file)

	tile = application.get_tile(0, 0)

	start_server(10999)

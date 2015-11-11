__author__ = 'Peter Stanko'

import os.path
import numpy as np
import h5py
import math
import logging
import minmax

from websocket_server import WebsocketServer


TILE_SIZE = 10

FORMAT = " <%(asctime)-15s> {%(filename)s:%(lineno)s - %(funcName)s()} [%(levelname)s]: %(message)s"
logging.basicConfig(format=FORMAT, level=logging.DEBUG)

ws_log = logging.getLogger("WebSocket")

class Tile:
	def __init__(self, index ,min_arr, max_arr):
		self.min = min_arr # channels
		self.max = max_arr # channels
		self.index = index
		self.logger= logging.getLogger(__name__)

	def build(self):
		array_chan = []

		self.logger.debug("Number of channels: {0}".format(len(self.min)))
		for i in range(len(self.min)):
			min_arr = self.min[i]
			max_add = self.max[i]
			minmax = []
			minmax.append(min_arr)
			minmax.append(max_add)
			array_chan.append(minmax)


		#self.logger.debug("MAX: {0}".format(minmax[0]))
		#self.logger.debug("MIN: {0}".format(minmax[1]))

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

			self.maxDataLevels = [self.data]
			self.minDataLevels = [self.data]



			for l in minData.keys():
				self.minDataLevels.append(minData[l])
			for l in maxData.keys():
				self.maxDataLevels.append(maxData[l])

			self.logger.debug("MaxDataLevels: {0}".format(self.maxDataLevels))
			self.logger.debug("MinDataLevels: {0}".format(self.minDataLevels))

	def get_tile(self, level, index):
		levels_count = len(self.minDataLevels)

		if level > levels_count:
			return None

		lvl_min = self.minDataLevels[level]
		lvl_max = self.maxDataLevels[level]
		self.logger.debug("Lvl MIN: {0}".format(lvl_min))
		self.logger.debug("Lvl MAX: {0}".format(lvl_max))

		pos = index * self.tile_size

		pos_min = pos
		pos_max = pos + self.tile_size
		self.logger.info("Requested tile @ [{0}, {1}]: [{2}, {3}] ".format(level, index, pos_min, pos_max))

		min_arr = lvl_min[pos_min:pos_max]
		max_arr = lvl_max[pos_min:pos_max]
		self.logger.debug("Min array: {0}  |  Max array: {1}".format(min_arr, max_arr))

		return Tile(index, min_arr, max_arr)

	def generate_minmax(self):
		self.logger.info("Generating min max.")
		minmax.create_minmax(self.h5file, self.h5path)




def new_client(client, server):
	ws_log.debug("New client connected and was given id %d" % client['id'])


# Called for every client disconnecting
def client_left(client, server):
	ws_log.debug("Client(%d) disconnected" % client['id'])


# Called when a client sends a message
def message_received(client, server, message):
	ws_log.debug("Received message: {0}".format( message))



def start_server(port):
	server = WebsocketServer(port)
	server.set_fn_new_client(new_client)
	server.set_fn_client_left(client_left)
	server.set_fn_message_received(message_received)
	server.run_forever()


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

	logger.debug("Starting application");
	application = Application(file_path=file_path, h5path=h5path, matrix_path=matrix_path, matrix_file=matrix_file)
	tile = application.get_tile(1,0)

	counter = 0
	for chan in tile.build():
		print("Channel {0}: min {1}".format(counter, chan[0]))
		print("Channel {0}: max {1}".format(counter, chan[1]))

		counter += 1

if __name__ == '__main__':
	main()

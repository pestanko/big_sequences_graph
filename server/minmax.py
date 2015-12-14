#! /usr/bin/env python3

import h5py
import numpy as np
import logging

FORMAT = " <%(asctime)-15s> {%(filename)s:%(lineno)s - %(funcName)s()} [%(levelname)s]: %(message)s"
logging.basicConfig(format=FORMAT, level=logging.DEBUG)


def create_minmax(f, h5path):
	logger = logging.getLogger(__name__)

	logger.info(" Creating min_max ...")

	base = 10
	index_set = f[h5path]
	logger.info("H5 path - {0}".format(h5path))

	shape = index_set.shape
	dtype = index_set.dtype
	n_chan = shape[1]
	n_sample = shape[0]

	logger.debug(" >>> Number of channels: %d", n_chan)
	logger.debug(" >>> tNumber of samples: %d", n_sample)

	base_log = int(np.log10(n_sample)) - 1

	if base != 10:
		base_log = int(np.log(n_sample) / np.log(base)) - 1

	n_levels = base_log  # last level magnitude 10**2

	logger.info(" >>> Number of levels: %d", n_levels)

	gh = f.create_group('minmax')
	g_min = gh.create_group('h_min')
	g_max = gh.create_group('h_max')

	n_hsamp = n_sample
	d_min0 = index_set
	d_max0 = index_set

	for l in range(n_levels):

		n_hsamp = int(np.ceil(n_hsamp / base))
		d_min = g_min.create_dataset(str(l), (n_hsamp, n_chan))
		d_max = g_max.create_dataset(str(l), (n_hsamp, n_chan))
		for i in range(n_hsamp):
			d_min[i, :] = np.min(d_min0[i * base:(i + 1) * base, :], axis=0)
			d_max[i, :] = np.max(d_max0[i * base:(i + 1) * base, :], axis=0)
		d_min0 = d_min
		d_max0 = d_max

		f.close()

import numpy as np

src = np.zeros(1024);
src[0] = 1.;
print(np.fft.fft(src));

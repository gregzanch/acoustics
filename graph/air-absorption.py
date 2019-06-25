
import math
import numpy as np
import matplotlib.pyplot as plt

## 1 atm in Pa
ps0 = 1.01325e5

def absorption(f, t=20, rh=60, ps=ps0):
    """ In dB/m

        f: frequency in Hz
        t: temperature in °C
        rh: relative humidity in %
        ps: atmospheric pressure in Pa

        From http://en.wikibooks.org/wiki/Engineering_Acoustics/Outdoor_Sound_Propagation
        See __main__ for actual curves.
    """
    T = t + 273.15
    T0 = 293.15
    T01 = 273.16

    Csat = -6.8346 * math.pow(T01 / T, 1.261) + 4.6151
    rhosat = math.pow(10, Csat)
    H = rhosat * rh * ps0 / ps

    frn = (ps / ps0) * math.pow(T0 / T, 0.5) * (
            9 + 280 * H * math.exp(-4.17 * (math.pow(T0 / T, 1/3.) - 1)))

    fro = (ps / ps0) * (24.0 + 4.04e4 * H * (0.02 + H) / (0.391 + H))

    alpha = f * f * (
        1.84e-11 / ( math.pow(T0 / T, 0.5) * ps / ps0 )
        + math.pow(T0 / T, -2.5)
        * (
            0.10680 * math.exp(-3352 / T) * frn / (f * f + frn * frn)
            + 0.01278 * math.exp(-2239.1 / T) * fro / (f * f + fro * fro)
            )
        )

    return 20 * alpha / math.log(10)

def plot():
    ## Figure in http://en.wikibooks.org/wiki/Engineering_Acoustics/Outdoor_Sound_Propagation
    ax = plt.subplot(111)
    fs = np.logspace(1, 6, num=100, endpoint=True, base=10)
    ys = np.zeros(fs.shape)
    rh = (0, 10, 20, 40, 60, 80, 100)
    for r in rh:
        for i in np.arange(fs.shape[0]):
            ys[i] = absorption(fs[i], rh=r)
        ax.loglog(fs, 100 * ys, label='rh:%d'%r)
    ax.grid(True)
    ax.set_xlabel('Frequency/pressure [Hz/atm]')
    ax.set_ylabel('Absorption coefficient/pressure [dB/100m.atm]')
    ax.legend(loc='lower right')
    plt.show()

def table():
    p = ps0
    for t in [30, 20, 10, 0]:
        for rh in [10, 20, 30, 50, 70, 90]:
            print("T=%2d RH=%2d " % (t, rh), end='')
            for f in [62.5, 125, 250, 500, 1000, 2000, 4000, 8000]:
                a = absorption(f, t, rh, p)
                print("%7.3f " % (a*1000), end='')
            print()


if __name__ == '__main__':
    table()
    plot()

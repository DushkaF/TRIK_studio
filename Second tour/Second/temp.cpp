#include <iostream>
#include <cmath>
using namespace std;

long double r(long double in)
{

    return round(in * 1000) / 1000;
}

string p(long double f)
{
    string repr = to_string(r(f)).substr(0, (to_string(static_cast<int>(f))).size() + 4);

    return repr;
}

int main()
{

    long double x, y, teta, fi, dt;

    long n;

    cin >> x >> y >> teta >> fi >> dt >> n;

    dt = dt / 1000;
    for (int i = 0; i < n; i++)

    {

        long double v, omega;

        cin >> v >> omega;

        long part = 5;

        for (int j = 1; j < 10; j++)

        {

            if (abs((v * dt) / pow(10, j)) < 0.0001)

            {

                part = j - 1;

                break;
            }
        }

        long double temp = dt;

        dt = dt / (2 * pow(10, part));

        for (int j = 0; j < 2 * pow(10, part); j++)

        {

            fi = fi + omega * dt;

            teta = teta + ((v * dt) / (2.7 * (1 / tan(fi))));

            x = x + v * cos(teta) * dt;

            y = y + v * sin(teta) * dt;
        }
        dt = temp;
    }

    cout<<(p(x))<<" "<<(p(y));

    return 0;
}

n = int(input())


def NOD(num):
    divs = []
    ost = num
    for i in range(1, int(num/2)):
        if num % i == 0 and i not in divs:
            divs.append(i)
            divs.append(num//i)
    divs.sort()
    return divs

divs = NOD(n)
'''print(divs)
print(len(divs))
print(divs[(len(divs)//2 - 1):(len(divs)//2) + 1])'''
min = divs[(len(divs)//2 - 1)] + 1
print(n // min + 1)
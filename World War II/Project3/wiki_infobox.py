import wptools
import time
import re
import sys
from pprint import pprint

def removeChars( field ):
    for x in range(0, len(badChars)):
        field = re.sub(badChars[x], repChars[x], field)
    return field

def htmlScrub( field ):
    return re.sub('<[^<]+?>', '', field)

checkFields = ["place", "date", "result", "combatant1", "commander1", "strength1", "casualties1", "combatant2", "commander2", "strength2", "casualties2"]
badChars = ['\n', '[[[]', '[]]]', '<br>']
repChars = ["", '', '', "; "]

inFile = sys.argv[1]
with open(inFile) as f:
    battles = f.readlines()[:-3]
battles = [x.strip() for x in battles]
output = open(inFile[9:-4]+".csv", "w")

output.write("Engagement\t" + "Location\t" + "Date\t" + "Result\t" + "Side 1\t" + "Leaders 1\t" + "Strength 1\t" + "Casualties 1\t" + "Side 2\t" + "Leaders 2\t" + "Strength 2\t" + "Casualties 2\t" + "Wikipedia Link\n")
for x in range(0, len(battles)):
    print '\r%s%d%s' % ("Progress: ", float(x)/len(battles) * 100, '%'),
    sys.stdout.flush()
    current = wptools.page(battles[x], silent=True).get_parse()
    #pprint(current.data['infobox'])
    if (current.data['infobox']):
        infobox = current.data['infobox']
        output.write(removeChars(current.data['title']).encode('utf-8') + '\t')
        for y in range(0, len(checkFields)):
            if (infobox.has_key(checkFields[y])):             
                data = removeChars(infobox[checkFields[y]])
                data = htmlScrub(data)
                output.write(data.encode('utf-8') + '\t')
            else:
                output.write('\t')
        #write in wikipedia link so it is easy to access this info
        output.write('https://en.wikipedia.org/wiki/' + current.data['title'].replace(" ", "_").encode('utf-8') + '\n')
print "\rDone\033[K"
output.close()


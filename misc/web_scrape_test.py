import urllib2 as url
import wikipedia as w
from bs4 import BeautifulSoup as bs
import re

# A dictionary to store the data we'll retrieve.
d = {}

# 1. Grab  the list from wikipedia.
w.set_lang('pt')
s = w.page(w.search('Lista de Senadores do Brasil da 55 legislatura')[0])
html = url.urlopen(s.url).read()
soup = bs(html, 'html.parser')


# 2. Names and links are on the second column of the second table.
table2 = soup.findAll('table')[1]
for row in table2.findAll('tr'):
    for colnum, col in enumerate(row.find_all('td')):
        if (colnum+1) % 5 == 2:
            a = col.find('a')
            link = 'https://pt.wikipedia.org' + a.get('href')
            d[a.get('title')] = {}
            d[a.get('title')]['link'] = link


# 3. Now that we have the links, we can iterate through them,
# and grab the info from the table.
for senator, data in d.iteritems():
    page = bs(url.urlopen(data['link']).read(), 'html.parser')
    # (flatten list trick: [a for b in nested for a in b])
    rows = [item for table in
            [item.find_all('td') for item in page.find_all('table')[0:3]]
            for item in table]
    for rownumber, row in enumerate(rows):
        if row.get_text() == 'Nascimento':
            birthinfo = rows[rownumber+1].getText().split('\n')
            try:
                d[senator]['birthplace'] = birthinfo[1]
            except IndexError:
                d[senator]['birthplace'] = ''
            birth = re.search('(.*\d{4}).*\((\d{2}).*\)', birthinfo[0])
            d[senator]['birthdate'] = birth.group(1)
            d[senator]['age'] = birth.group(2)
        if row.get_text() == 'Partido':
            d[senator]['party'] = rows[rownumber + 1].getText()
        if 'Profiss' in row.get_text():
            d[senator]['profession'] = rows[rownumber + 1].getText()

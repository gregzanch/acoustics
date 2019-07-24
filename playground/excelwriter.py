import xlsxwriter
import json
import numpy as np

f = open("onaxis.json", "r")
x = ""
if f.mode == 'r':
      x = f.read();

y = json.loads(x)

# the result is a Python dictionary:
workbook = xlsxwriter.Workbook('fabric.xlsx')

# Add a worksheet to hold the data.
worksheet = workbook.add_worksheet()

# Add a chartsheet. A worksheet that only holds a chart.
chartsheet = workbook.add_chartsheet()

# Add a format for the headings.
bold = workbook.add_format({'bold': 1})

colmns = list(map(lambda x: x.upper()+"1", [char for char in 'abcdefghijklmnopqrstuvwxyz']))

for i,c in enumerate(y):
      worksheet.write_column(colmns[i], y[i])
      # print(c)

# # worksheet.write_row('A1', headings, bold)
# worksheet.write_column('A1', y[0])
# worksheet.write_column('B1', y[1])
# worksheet.write_column('C1', y[2])


# # Create a new bar chart.
# chart1 = workbook.add_chart({'type': 'line'})

# # Configure the first series.
# chart1.add_series({
#     'name':       '=Sheet1!$B$1',
#     'categories': '=Sheet1!$A$2:$A$7',
#     'values':     '=Sheet1!$B$2:$B$7',
# })

# # Configure a second series. Note use of alternative syntax to define ranges.
# chart1.add_series({
#     'name':       ['Sheet1', 0, 2],
#     'categories': ['Sheet1', 1, 0, 6, 0],
#     'values':     ['Sheet1', 1, 2, 6, 2],
# })

# # Add a chart title and some axis labels.
# chart1.set_title ({'name': 'Results of sample analysis'})
# chart1.set_x_axis({'name': 'Test number'})
# chart1.set_y_axis({'name': 'Sample length (mm)'})

# # Set an Excel chart style.
# chart1.set_style(11)

# # Add the chart to the chartsheet.
# chartsheet.set_chart(chart1)

# # Display the chartsheet as the active sheet when the workbook is opened.
# chartsheet.activate();

workbook.close()

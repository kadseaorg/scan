const fs = require('fs')
const data = JSON.parse(fs.readFileSync('data.json', 'utf8'))

let address_to_labels = ''
Object.entries(data).forEach(([address, info]) => {
	let labels = info.labels.join(',')
	address_to_labels += `"${address}","${info.name}","${labels}"\n`
})

fs.writeFileSync('address_to_labels.csv', address_to_labels)

let labels = {}

Object.entries(data).forEach(([address, info]) => {
	let lowerCaseAddress = address.toLowerCase()
	info.labels.forEach((label) => {
		if (!labels[label]) {
			labels[label] = []
		}
		labels[label].push(lowerCaseAddress)
	})
})

let label_to_addresses = ''
Object.entries(labels).forEach(([label, addresses]) => {
	label_to_addresses += `"${label}","{${addresses.join(',')}}"\n`
})

fs.writeFileSync('label_to_addresses.csv', label_to_addresses)

// psql postgresql://postgres:postgres@localhost:5432/postgres

// CREATE TEMP TABLE temp_table (address TEXT, name TEXT, labels TEXT);
// \copy temp_table FROM 'address_to_labels.csv' CSV;
// INSERT INTO address_to_labels (address, name, labels) SELECT address, name, string_to_array(labels, ',') FROM temp_table;
// DROP TABLE temp_table;

// \copy label_to_addresses(label,addresses) FROM 'label_to_addresses.csv' CSV

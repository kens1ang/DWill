## Credits
This project was created as part of University of Nottingham Malaysia's module, COMP2019/G52GRP Software Engineering Group Project. This application was developed by **Group O**, consisting of the following members:



| Name | Student ID | OWA |
| -- | -- | -- |
| Carmel Natasha Barnabas | 20509430 | hcycb2 |
| Anshana Manoharan | 20506329 | hcyam4 | 
| Lai Ken Siang | 20409289 | hfykl13 |
| Adyan Dean bin Wafdi | 20413774 | hfyaw2 |

Developed using React, thirdweb and Pinata.

----
## Table of Contents
[Getting Started](#getting-started)
[Constants and environment variables](#constants-and-environment-variables)  
[Project Abstract](#project-abstract)   

----
## Getting Started

Download the project files from the encryption branch.

Install dependancies using: 

```bash
yarn install
```

Run the project using:

```bash
yarn dev
```

Run the following in the smart-contracts directory to deploy a smart contract:

```bash
npx thirdweb deploy
```

----
## Constants and environment variables

Check the `constants.ts` file for API keys, client IDs, secret keys and smart contract addresses.

----

## Project Abstract
Our application is a decentralized storage system equipped with a benefactor-beneficiary system and a dead man's switch. To preface, our application consists of two key players:

1. **Benefactor** - owner of the accounts; has access to all our basic functionalities.
2. **Beneficiary** - receiver of assets; has the ability to trigger the dead man's switch which begins a countdown and can lead to retrieval of the benefactor's files, depending on whether the switch has been switched off or not.

 Our basic functionalities include the following:
- **Subscription**: Users who are able subscribed to our service are able upload assets as well as assign beneficiaries
- **Upload**: Users are able to upload their assets onto IPFS, accessed through the Pinata gateway. Files are also able to be encrypted.
- **Dead Man's Switch**: Beneficiaries that trigger this begin a seven day countdown in which the benefactor must switch off to ensure they are alive. In the case that the benefactor is unable to switch it off, they will be assumed dead and thus, beneficiaries will be able to access their assets.
----
## Learn More

To learn more about thirdweb, Vite and React:
- [thirdweb React Documentation](https://docs.thirdweb.com/react) - learn about thirdwebs React SDK.
- [thirdweb TypeScript Documentation](https://docs.thirdweb.com/react) - learn about thirdwebs JavaScript/TypeScript SDK.
- [thirdweb Portal](https://docs.thirdweb.com/react) - check guides and development resources.
- [Vite Documentation](https://vitejs.dev/guide/) - learn about Vite features.
- [React documentation](https://reactjs.org/) - learn React.
- [Templates](https://thirdweb.com/templates)

You can check out [the thirdweb GitHub organization](https://github.com/thirdweb-dev)

## Wallet details
wallet pw: dwill2024
nasty river globe sample jeans water mask nasty panel boil develop collect
0x8705459c495E95E0c2c45DD0601B5d2Ec172a87E
gmail: dwill.twenty24@gmail.com
pass: ADKSCMAS2024

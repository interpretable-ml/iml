from setuptools import setup


setup(name='iml',
      version='0.2',
      description='Interpretable Machine Learning (iML) package. Explain the predictions of any model.',
      url='http://github.com/interpretable-ml/iml',
      author='Scott Lundberg',
      author_email='slund1@cs.washington.edu',
      license='MIT',
      packages=['iml', 'iml.explainers'],
      #package_dir={'': 'python'},
      data_files=[
          ('javascript/build', ['../javascript/build/bundle.js', '../javascript/build/logoSmallGray.png'])
      ],
      install_requires=['numpy', 'scipy', 'esvalues'],
      test_suite='nose.collector',
      tests_require=['nose'],
      zip_safe=False)


# # setuptools has an unresolved bug in develop
# if sys.argv[1] == "develop":
#     print(site.getsitepackages()[0])
#     print("Warning develop is broken in setuptools when using package_dir! https://github.com/pypa/setuptools/issues/230")
